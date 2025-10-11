// src/pages/api/profile.ts
export const prerender = false;
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

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

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      // For testing, use a hardcoded user ID
      const testUserId = "ck5Tv8SmMgVOKsBdIxhpeglQb52THjeG";

      const profile = await prisma.profiles.findUnique({
        where: { id: testUserId },
      });

      if (!profile) {
        return new Response(
          JSON.stringify({
            id: testUserId,
            display_name: "",
            accent_color: "blue",
            theme: "system",
            language: "en",
            email_notifications: true,
            push_notifications: true,
            two_factor_enabled: false,
            created_at: null,
            updated_at: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          id: profile.id,
          display_name: profile.display_name || "",
          accent_color: profile.accent_color || "blue",
          theme: profile.theme || "system",
          language: profile.language || "en",
          email_notifications: !!profile.email_notifications,
          push_notifications: !!profile.push_notifications,
          two_factor_enabled: !!profile.two_factor_enabled,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get profile using Prisma
    let profile = await prisma.profiles.findUnique({
      where: { id: session.user.id },
    });

    if (!profile) {
      // Create default profile if missing
      profile = await prisma.profiles.create({
        data: {
          id: session.user.id,
          display_name: "",
          theme: "system",
          language: "en",
          accent_color: "blue",
          email_notifications: true,
          push_notifications: true,
          two_factor_enabled: false,
        },
      });
    }

    return new Response(
      JSON.stringify({
        id: profile.id,
        display_name: profile.display_name || "",
        accent_color: profile.accent_color || "blue",
        theme: profile.theme || "system",
        language: profile.language || "en",
        email_notifications: !!profile.email_notifications,
        push_notifications: !!profile.push_notifications,
        two_factor_enabled: !!profile.two_factor_enabled,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Profile GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Shared update logic for POST and PUT
async function updateProfile(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id || "ck5Tv8SmMgVOKsBdIxhpeglQb52THjeG"; // Fallback for testing

  const body = await request.json().catch(() => ({}));
  const updates: any = {};

  // Map and validate allowed fields
  for (const [key, value] of Object.entries(body)) {
    if (key in ALLOWED) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: "No valid fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update profile using Prisma
  const profile = await prisma.profiles.update({
    where: { id: userId },
    data: {
      ...updates,
      updated_at: new Date(),
    },
  });

  return new Response(
    JSON.stringify({
      id: profile.id,
      display_name: profile.display_name || "",
      accent_color: profile.accent_color || "blue",
      theme: profile.theme || "system",
      language: profile.language || "en",
      email_notifications: !!profile.email_notifications,
      push_notifications: !!profile.push_notifications,
      two_factor_enabled: !!profile.two_factor_enabled,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    return await updateProfile(request);
  } catch (error) {
    console.error("Profile POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    return await updateProfile(request);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
