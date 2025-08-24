// src/pages/api/db.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { db } from "@/lib/db";

// Backtick-sanitizer for identifiers
function id(name: string) {
  const safe = String(name).replace(/[^a-zA-Z0-9_]/g, "_");
  return "`" + safe + "`";
}

// WHERE builder (eq, in, like/ilike)
type Filter =
  | { op: "eq"; column: string; value: any }
  | { op: "in"; column: string; values: any[] }
  | { op: "like" | "ilike"; column: string; value: string };

function buildWhere(filters?: Filter[]) {
  const clauses: string[] = [];
  const params: any[] = [];
  if (!filters || filters.length === 0) return { sql: "", params };

  for (const f of filters) {
    if (f.op === "eq") {
      clauses.push(`${id(f.column)} = ?`);
      params.push(f.value);
    } else if (f.op === "in") {
      const qs = (f.values ?? []).map(() => "?").join(",");
      clauses.push(`${id(f.column)} IN (${qs})`);
      params.push(...(f.values ?? []));
    } else if (f.op === "like" || f.op === "ilike") {
      // emulate ilike via LOWER()
      clauses.push(`LOWER(${id(f.column)}) LIKE LOWER(?)`);
      params.push(f.value);
    }
  }
  return { sql: clauses.length ? " WHERE " + clauses.join(" AND ") : "", params };
}

// Simple uuid
const genId = () =>
  // @ts-ignore
  (globalThis.crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2)));

export const POST: APIRoute = async ({ request }) => {
  try {
    // auth required
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body: any = await request.json().catch(() => ({}));
    // accept both 'op' and 'action'
    const op = String(body?.op || body?.action || "");

    // -------- optional helpers you used before --------
    if (op === "create_table" || op === "createTable") {
      const table = String(body?.table || "");
      const columns = Array.isArray(body?.columns) ? body.columns : [];
      if (!table || !columns.length) return new Response("Missing table or columns", { status: 400 });

      // very small DDL helper (unchanged behavior)
      const defs: string[] = [];
      const pks: string[] = [];
      for (const c of columns) {
        const parts: string[] = [id(c.name), c.type];
        if (!c.nullable) parts.push("NOT NULL");
        if (c.default) parts.push("DEFAULT " + c.default);
        if (c.unique) parts.push("UNIQUE");
        defs.push(parts.join(" "));
        if (c.primaryKey) pks.push(id(c.name));
      }
      if (pks.length) defs.push(`PRIMARY KEY (${pks.join(",")})`);
      const sql = `CREATE TABLE IF NOT EXISTS ${id(table)} (\n  ${defs.join(",\n  ")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
      await db.query(sql);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (op === "ping") {
      const [rows] = await db.query("SELECT 1 AS ok");
      return new Response(JSON.stringify(rows), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // -------------------------------------------------

    // ====== generic CRUD for supabase-like shim ======
    const table = String(body?.table || "");
    if (!table) return new Response(JSON.stringify({ error: "Missing table" }), { status: 400, headers: { "Content-Type": "application/json" } });

    // SELECT
    if (op === "select") {
      const columns = body?.columns;
      const cols =
        columns === "*" || !columns
          ? "*"
          : Array.isArray(columns)
            ? columns.map((c: string) => id(c)).join(", ")
            : String(columns)
                .split(",")
                .map((s) => s.trim())
                .map((c) => id(c))
                .join(", ");

      const { sql: whereSql, params } = buildWhere(body?.filters);
      const orderSql = body?.order ? ` ORDER BY ${id(body.order.by)} ${body.order.ascending === false ? "DESC" : "ASC"}` : "";
      const limitSql = body?.limit ? ` LIMIT ${Number(body.limit)}` : "";

      const [rows] = await db.query(`SELECT ${cols} FROM ${id(table)}${whereSql}${orderSql}${limitSql}`, params);
      const data = Array.isArray(rows) ? rows : [];
      if (body?.single) {
        return new Response(JSON.stringify(data[0] ?? null), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // INSERT
    if (op === "insert") {
      const rows = Array.isArray(body?.values) ? body.values : [];
      if (!rows.length) return new Response(JSON.stringify({ error: "No values" }), { status: 400, headers: { "Content-Type": "application/json" } });

      // add id if missing
      const enriched = rows.map((r) => (("id" in r) && r.id ? r : { id: genId(), ...r }));
      const colset = new Set<string>();
      enriched.forEach((r) => Object.keys(r).forEach((k) => colset.add(k)));
      const cols = Array.from(colset);
      const placeholders = "(" + cols.map(() => "?").join(",") + ")";
      const params: any[] = [];
      for (const r of enriched) for (const c of cols) params.push(r[c] ?? null);

      await db.query(`INSERT INTO ${id(table)} (${cols.map(id).join(",")}) VALUES ${enriched.map(() => placeholders).join(",")}`, params);

      if (body?.returning || body?.single || body?.columns) {
        const ids = enriched.map((r) => r.id);
        const colStr =
          body?.columns === "*" || !body?.columns
            ? "*"
            : Array.isArray(body?.columns)
              ? body.columns.map((c: string) => id(c)).join(", ")
              : "*";
        const [rows2] = await db.query(`SELECT ${colStr} FROM ${id(table)} WHERE ${id("id")} IN (${ids.map(() => "?").join(",")})`, ids);
        const data = Array.isArray(rows2) ? rows2 : [];
        if (body?.single) {
          return new Response(JSON.stringify(data[0] ?? null), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // UPDATE
    if (op === "update") {
      const values = body?.values && typeof body.values === "object" ? body.values : null;
      if (!values) return new Response(JSON.stringify({ error: "Missing values" }), { status: 400, headers: { "Content-Type": "application/json" } });

      const keys = Object.keys(values);
      if (!keys.length) return new Response(JSON.stringify({ error: "No columns to update" }), { status: 400, headers: { "Content-Type": "application/json" } });

      const sets = keys.map((k) => `${id(k)} = ?`).join(", ");
      const setParams = keys.map((k) => values[k]);

      const { sql: whereSql, params: whereParams } = buildWhere(body?.filters);
      if (!whereSql) return new Response(JSON.stringify({ error: "Missing WHERE filters" }), { status: 400, headers: { "Content-Type": "application/json" } });

      await db.query(`UPDATE ${id(table)} SET ${sets}${whereSql}`, [...setParams, ...whereParams]);

      if (body?.returning || body?.single || body?.columns) {
        // try to return rows based on id filter(s)
        let ids: any[] = [];
        for (const f of body?.filters ?? []) {
          if (f.op === "eq" && f.column === "id") ids.push(f.value);
          if (f.op === "in" && f.column === "id") ids.push(...(f.values ?? []));
        }
        if (ids.length) {
          const colStr =
            body?.columns === "*" || !body?.columns
              ? "*"
              : Array.isArray(body?.columns)
                ? body.columns.map((c: string) => id(c)).join(", ")
                : "*";
          const [rows2] = await db.query(`SELECT ${colStr} FROM ${id(table)} WHERE ${id("id")} IN (${ids.map(() => "?").join(",")})`, ids);
          const data = Array.isArray(rows2) ? rows2 : [];
          if (body?.single) {
            return new Response(JSON.stringify(data[0] ?? null), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // DELETE
    if (op === "delete") {
      const { sql: whereSql, params } = buildWhere(body?.filters);
      if (!whereSql) return new Response(JSON.stringify({ error: "Missing WHERE filters" }), { status: 400, headers: { "Content-Type": "application/json" } });
      await db.query(`DELETE FROM ${id(table)}${whereSql}`, params);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response("Unknown action", { status: 400 });
  } catch (err: any) {
    console.error("[/api/db] error:", err?.stack || err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
