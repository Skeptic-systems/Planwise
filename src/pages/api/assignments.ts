// src/pages/api/assignments.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

// build "YYYY-MM-DD HH:MM:SS"
function toMySqlDatetime(hhmm: string, dateStr?: string) {
  const base = dateStr ?? new Date().toISOString().slice(0, 10);
  const [h, m] = String(hhmm || "00:00").split(":").map((x) => Number(x || 0));
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${base} ${hh}:${mm}:00`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // auth (gleich wie in deinen anderen API-Routen)
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { planId, fieldName, name, email, startTime, endTime, color, date } = body || {};

    if (!planId || !fieldName || !name || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // find field_id by plan_id + fieldName
    const [rows] = await db.query("SELECT id FROM fields WHERE plan_id = ? AND name = ? LIMIT 1", [planId, fieldName]);
    const field = Array.isArray(rows) ? rows[0] : null;
    if (!field?.id) {
      return new Response(JSON.stringify({ error: "Field not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const s = toMySqlDatetime(String(startTime), date);
    const e = toMySqlDatetime(String(endTime), date);

    // insert
    await db.query(
      "INSERT INTO assignments (id, plan_id, field_id, name, email, start_time, end_time, color) VALUES (?,?,?,?,?,?,?,?)",
      [id, planId, field.id, String(name), email ? String(email) : null, s, e, color ? String(color) : null]
    );

    // return inserted row
    const [inserted] = await db.query("SELECT * FROM assignments WHERE id = ? LIMIT 1", [id]);
    const data = Array.isArray(inserted) ? inserted[0] : null;

    return new Response(JSON.stringify({ data }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[api/assignments POST] error:", err?.stack || err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
