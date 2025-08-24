// src/pages/api/plans.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { db } from "@/lib/db";

// simple uuid
const uid = () =>
  // @ts-ignore
  (globalThis.crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2)));

// GET: return personal + team plans for current user (dedup by id)
export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const userId = session.user.id;

    // personal plans
    const [personalRows] = await db.query("SELECT * FROM plans WHERE user_id = ?", [userId]);
    const personal = Array.isArray(personalRows) ? (personalRows as any[]) : [];

    // team plan ids (may include creator's own team plans)
    const [memberRows] = await db.query("SELECT plan_id FROM plan_members WHERE user_id = ?", [userId]);
    const memberIds = Array.isArray(memberRows) ? (memberRows as any[]).map(r => r.plan_id) : [];

    // fetch only those team plans that are not already in personal
    const personalIds = new Set(personal.map(p => p.id));
    const missingTeamIds = memberIds.filter(id => !personalIds.has(id));

    let teamPlans: any[] = [];
    if (missingTeamIds.length) {
      const placeholders = missingTeamIds.map(() => "?").join(",");
      const [rows] = await db.query(`SELECT * FROM plans WHERE id IN (${placeholders})`, missingTeamIds);
      teamPlans = Array.isArray(rows) ? (rows as any[]) : [];
    }

    // dedupe by id (safety)
    const byId = new Map<string, any>();
    [...personal, ...teamPlans].forEach(p => byId.set(p.id, p));
    const all = Array.from(byId.values());

    return new Response(JSON.stringify(all), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[/api/plans][GET]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

// POST: create plan (+ default tab, field, team member if needed)
export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const title: string = (body?.title ?? "").toString().trim();
    const description: string | null = (body?.description ?? null) ? String(body.description) : null;
    const isTeam: boolean = !!body?.is_team_plan;

    if (!title) return new Response(JSON.stringify({ error: "Title required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const now = new Date();
    const planId = uid();

    await db.query(
      "INSERT INTO plans (id, title, description, user_id, is_team_plan, created_at) VALUES (?,?,?,?,?,?)",
      [planId, title, description, session.user.id, isTeam ? 1 : 0, now]
    );

    const tabId = uid();
    await db.query(
      "INSERT INTO plan_tabs (id, plan_id, name, type, position, created_at) VALUES (?,?,?,?,?,?)",
      [tabId, planId, "Default Tab", "personal", 0, now]
    );

    await db.query(
      "INSERT INTO fields (id, plan_id, plan_tab_id, name, created_at) VALUES (?,?,?,?,?)",
      [uid(), planId, tabId, "Field 1", now]
    );

    if (isTeam) {
      await db.query(
        "INSERT INTO plan_members (id, plan_id, user_id, role, created_at) VALUES (?,?,?,?,?)",
        [uid(), planId, session.user.id, "admin", now]
      );
    }

    const [rows] = await db.query("SELECT * FROM plans WHERE id = ? LIMIT 1", [planId]);
    const plan = Array.isArray(rows) ? rows[0] : null;

    return new Response(JSON.stringify(plan), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[/api/plans][POST]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
