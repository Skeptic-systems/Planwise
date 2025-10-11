// src/pages/api/plans.ts
export const prerender = false;
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

// simple uuid
const uid = () =>
  // @ts-ignore
  globalThis.crypto?.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);

// GET: return personal + team plans for current user (dedup by id)
export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || "ck5Tv8SmMgVOKsBdIxhpeglQb52THjeG"; // Fallback for testing

    // archived plan IDs to exclude
    const archivedPlanIds = await prisma.plan_archive.findMany({
      where: { user_id: userId },
      select: { plan_id: true },
    });
    const archivedIds = archivedPlanIds.map((a) => a.plan_id);

    // personal plans (exclude archived)
    const personal = await prisma.plans.findMany({
      where: {
        user_id: userId,
        ...(archivedIds.length ? { id: { notIn: archivedIds } } : {}),
      },
    });

    // team plan ids
    const memberRows = await prisma.plan_members.findMany({
      where: { user_id: userId },
      select: { plan_id: true },
    });
    const memberIds = memberRows.map((r) => r.plan_id);

    // fetch only those team plans that are not already in personal
    const personalIds = new Set(personal.map((p) => p.id));
    const missingTeamIds = memberIds.filter((id) => !personalIds.has(id));

    let teamPlans: any[] = [];
    if (missingTeamIds.length) {
      teamPlans = await prisma.plans.findMany({
        where: {
          id: { in: missingTeamIds, ...(archivedIds.length ? { notIn: archivedIds } : {}) },
        },
      });
    }

    // dedupe by id (safety)
    const byId = new Map<string, any>();
    [...personal, ...teamPlans].forEach((p) => byId.set(p.id, p));
    const all = Array.from(byId.values());

    return new Response(JSON.stringify(all), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[/api/plans][GET]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST: create plan (+ default tab, field, team member if needed)
export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || "ck5Tv8SmMgVOKsBdIxhpeglQb52THjeG"; // Fallback for testing

    const body = await request.json();
    const title: string = (body?.title ?? "").toString().trim();
    const description: string | null =
      (body?.description ?? null) ? String(body.description) : null;
    const isTeam: boolean = !!body?.is_team_plan;

    if (!title)
      return new Response(JSON.stringify({ error: "Title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const now = new Date();
    const planId = uid();

    // Create plan
    await prisma.plans.create({
      data: {
        id: planId,
        title,
        description: description ?? null,
        user_id: userId,
        is_team_plan: isTeam,
        created_at: now,
      },
    });

    const tabId = uid();
    await prisma.plan_tabs.create({
      data: {
        id: tabId,
        plan_id: planId,
        name: "Default Tab",
        type: "personal",
        position: 0,
        created_at: now,
      },
    });

    // Create default field for the tab
    await prisma.fields.create({
      data: {
        id: uid(),
        plan_id: planId,
        plan_tab_id: tabId,
        name: "Field 1",
        created_at: now,
      },
    });

    if (isTeam) {
      await prisma.plan_members.create({
        data: {
          id: uid(),
          plan_id: planId,
          user_id: userId,
          role: "admin",
          created_at: now,
        },
      });
    }

    // Return created plan
    const createdPlan = await prisma.plans.findUnique({ where: { id: planId } });
    return new Response(JSON.stringify(createdPlan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[/api/plans][POST]", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
