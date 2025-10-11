import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch archived plan IDs
    const archivedPlanIds = await prisma.plan_archive.findMany({
      where: { user_id: session.user.id },
      orderBy: { archived_at: "desc" },
      select: { plan_id: true },
    });

    if (archivedPlanIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the actual plan data
    const planIds = archivedPlanIds.map((a) => a.plan_id);
    const archivedPlans = planIds.length
      ? await prisma.plans.findMany({ where: { id: { in: planIds } } })
      : [];

    return new Response(JSON.stringify(archivedPlans), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching archived plans:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch archived plans" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { action, archivedPlanId } = body;

    if (action === "restore" && archivedPlanId) {
      // Get archived plan data
      const archivedPlan = await prisma.plan_archive.findUnique({ where: { id: archivedPlanId } });

      if (!archivedPlan) {
        return new Response(JSON.stringify({ error: "Archived plan not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const planData = JSON.parse(archivedPlan.plan_data as any);

      // Restore the plan
      await prisma.plans.create({
        data: {
          id: archivedPlan.plan_id,
          title: planData.title,
          description: planData.description ?? null,
          is_team_plan: !!planData.is_team_plan,
          user_id: planData.user_id,
          created_at: new Date(planData.created_at),
        },
      });

      // Restore members if it's a team plan
      if (planData.members && Array.isArray(planData.members)) {
        const memberValues = planData.members.map((member: any) => ({
          id: member.id,
          plan_id: member.plan_id || member.planId,
          user_id: member.user_id || member.userId,
          role: member.role,
          created_at: new Date(member.created_at || new Date()),
        }));
        for (const mv of memberValues) {
          await prisma.plan_members.create({ data: mv });
        }
      }

      // Remove from archive
      await prisma.plan_archive.delete({ where: { id: archivedPlanId } });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing archive action:", error);
    return new Response(JSON.stringify({ error: "Failed to process archive action" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
