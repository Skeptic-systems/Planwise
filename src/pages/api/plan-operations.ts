export const prerender = false;
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

// Simple UUID generator
const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id || "ck5Tv8SmMgVOKsBdIxhpeglQb52THjeG"; // Fallback for testing

    const body = await request.json();
    const { action, planId, name, description, isTeamPlan } = body;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID required" }), { status: 400 });
    }

    switch (action) {
      case "update": {
        if (!name)
          return new Response(JSON.stringify({ error: "Title required for update" }), {
            status: 400,
          });
        await prisma.plans.update({
          where: { id: planId },
          data: {
            title: name,
            description: description || null,
            is_team_plan: !!isTeamPlan,
          },
        });
        return new Response(JSON.stringify({ message: "Plan updated successfully" }), {
          status: 200,
        });
      }

      case "archive": {
        // mimic previous behavior (simple delete)
        await prisma.plan_tabs.deleteMany({ where: { plan_id: planId } });
        await prisma.plan_members.deleteMany({ where: { plan_id: planId } });
        await prisma.plan_archive.deleteMany({ where: { plan_id: planId } });
        await prisma.plans.delete({ where: { id: planId } });
        return new Response(JSON.stringify({ message: "Plan archived successfully" }), {
          status: 200,
        });
      }

      case "restore": {
        // Remove from archive
        await prisma.plan_archive.deleteMany({ where: { plan_id: planId } });
        return new Response(JSON.stringify({ message: "Plan restored successfully" }), {
          status: 200,
        });
      }

      case "delete": {
        await prisma.plan_tabs.deleteMany({ where: { plan_id: planId } });
        await prisma.plan_members.deleteMany({ where: { plan_id: planId } });
        await prisma.plan_archive.deleteMany({ where: { plan_id: planId } });
        await prisma.plans.delete({ where: { id: planId } });
        return new Response(JSON.stringify({ message: "Plan deleted successfully" }), {
          status: 200,
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }
  } catch (error: any) {
    console.error("Plan operations error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
    });
  }
};
