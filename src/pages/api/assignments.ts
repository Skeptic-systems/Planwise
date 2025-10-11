// src/pages/api/assignments.ts
export const prerender = false;
import crypto from "node:crypto";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

// build "YYYY-MM-DD HH:MM:SS"
function toMySqlDatetime(hhmm: string, dateStr?: string) {
  const base = dateStr ?? new Date().toISOString().slice(0, 10);
  const [h, m] = String(hhmm || "00:00")
    .split(":")
    .map((x) => Number(x || 0));

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
    const { planId, planTabId, fieldName, name, email, startTime, endTime, color, date } =
      body || {};

    if (!fieldName || !name || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // find field_id by fieldName and either planTabId or planId
    let field: { id: string; plan_id: string; plan_tab_id: string } | null = null;
    if (planTabId) {
      field = await prisma.fields.findFirst({
        where: {
          plan_tab_id: planTabId,
          name: fieldName,
        },
        select: { id: true, plan_id: true, plan_tab_id: true },
      });
    } else if (planId) {
      // Find field by planId - need to get tabs first
      const tabs = await prisma.plan_tabs.findMany({
        where: { plan_id: planId },
        select: { id: true },
      });
      const tabIds = tabs.map((t) => t.id);

      field = await prisma.fields.findFirst({
        where: {
          plan_tab_id: { in: tabIds },
          name: fieldName,
        },
        select: { id: true, plan_id: true, plan_tab_id: true },
      });
    }

    if (!field?.id) {
      return new Response(JSON.stringify({ error: "Field not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const s = toMySqlDatetime(String(startTime), date);
    const e = toMySqlDatetime(String(endTime), date);

    // Use the field's plan_id if planId wasn't provided
    const actualPlanId = planId || field.plan_id;

    // CRITICAL: Use raw SQL to bypass Prisma's timezone conversion
    // Prisma ALWAYS converts DateTime to UTC, which causes +2h offset
    // Using $executeRaw with literal strings preserves wall-clock time
    await prisma.$executeRaw`
      INSERT INTO assignments (id, field_id, plan_id, name, email, start_time, end_time, color, created_at)
      VALUES (
        ${id},
        ${field.id},
        ${actualPlanId},
        ${String(name)},
        ${email ? String(email) : null},
        ${s},
        ${e},
        ${color ? String(color) : null},
        NOW()
      )
    `;

    // Fetch the created record to return it
    const data = await prisma.assignments.findUnique({
      where: { id },
    });

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const error = err as Error;
    console.error("[api/assignments POST] error:", error?.stack || error?.message || err);
    return new Response(JSON.stringify({ error: error?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
