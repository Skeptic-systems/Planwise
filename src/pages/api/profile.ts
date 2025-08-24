// src/pages/api/profile.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { db } from "@/lib/db";

// map allowed payload -> DB columns
const ALLOWED: Record<string, string> = {
  display_name: "display_name",
  accent_color: "accent_color",
  theme: "theme",
  language: "language",
  email_notifications: "email_notifications",
  push_notifications: "push_notifications",
  two_factor_enabled: "two_factor_enabled",
};

// dev-safe: ensure table + columns exist
async function ensureProfilesSchema() {
  // create table if missing
  await db.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(36) NOT NULL,
      display_name VARCHAR(255) NULL,
      accent_color VARCHAR(32) NULL,
      theme VARCHAR(16) NULL,
      language VARCHAR(16) NULL,
      email_notifications TINYINT(1) NOT NULL DEFAULT 1,
      push_notifications TINYINT(1) NOT NULL DEFAULT 1,
      two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // add columns if older dump is missing them (idempotent)
  const addCol = async (name: string, ddl: string) => {
    // check information_schema
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME=? AND TABLE_SCHEMA = DATABASE()`,
      [name]
    );
    const exists = Array.isArray(cols) && (cols as any[]).length > 0;
    if (!exists) {
      await db.query(`ALTER TABLE profiles ADD COLUMN ${ddl}`);
    }
  };

  await addCol("email_notifications", "email_notifications TINYINT(1) NOT NULL DEFAULT 1");
  await addCol("push_notifications", "push_notifications TINYINT(1) NOT NULL DEFAULT 1");
  await addCol("two_factor_enabled", "two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0");
  await addCol("accent_color", "accent_color VARCHAR(32) NULL");
  await addCol("theme", "theme VARCHAR(16) NULL");
  await addCol("language", "language VARCHAR(16) NULL");
  await addCol("display_name", "display_name VARCHAR(255) NULL");
  await addCol("created_at", "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addCol("updated_at", "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
}

type ProfileRow = {
  id: string;
  display_name?: string | null;
  accent_color?: string | null;
  theme?: string | null;
  language?: string | null;
  email_notifications?: number | null;
  push_notifications?: number | null;
  two_factor_enabled?: number | null;
  created_at?: any;
  updated_at?: any;
};

function normalize(row: ProfileRow) {
  return {
    id: row.id,
    display_name: row.display_name ?? "",
    accent_color: row.accent_color ?? "blue",
    theme: row.theme ?? "system",
    language: row.language ?? "en",
    email_notifications: !!(row.email_notifications ?? 1),
    push_notifications: !!(row.push_notifications ?? 1),
    two_factor_enabled: !!(row.two_factor_enabled ?? 0),
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    await ensureProfilesSchema();

    // create default row if missing
    await db.query(
      `INSERT INTO profiles (id, display_name, accent_color, theme, language)
       VALUES (?, ?, 'blue', 'system', 'en')
       ON DUPLICATE KEY UPDATE id = id`,
      [session.user.id, session.user.name || "User"]
    );

    const [rows] = await db.query(
      `SELECT id, display_name, accent_color, theme, language,
              email_notifications, push_notifications, two_factor_enabled,
              created_at, updated_at
         FROM profiles
        WHERE id = ? LIMIT 1`,
      [session.user.id]
    );

    const row = Array.isArray(rows) && rows[0] ? (rows[0] as ProfileRow) : null;
    return new Response(JSON.stringify(row ? normalize(row) : null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[/api/profile][GET]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    await ensureProfilesSchema();

    const body = await request.json().catch(() => ({}));
    const sets: string[] = [];
    const params: any[] = [];

    for (const [k, v] of Object.entries(body || {})) {
      const col = ALLOWED[k];
      if (!col) continue;
      const val = typeof v === "boolean" ? (v ? 1 : 0) : v;
      sets.push(`${col} = ?`);
      params.push(val);
    }

    if (!sets.length) return new Response("No valid fields", { status: 400 });

    // guarantee row exists
    await db.query(
      `INSERT INTO profiles (id, display_name, accent_color, theme, language)
       VALUES (?, ?, 'blue', 'system', 'en')
       ON DUPLICATE KEY UPDATE id = id`,
      [session.user.id, session.user.name || "User"]
    );

    params.push(session.user.id);
    await db.query(
      `UPDATE profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[/api/profile][PUT]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
