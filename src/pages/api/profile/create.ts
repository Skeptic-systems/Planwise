import { prisma } from "@/lib/prisma";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, displayName } = await request.json();

    // Insert profile using Prisma
    await prisma.profiles.create({
      data: {
        id: userId,
        display_name: displayName || "",
        accent_color: "blue",
        theme: "system",
        language: "en",
        email_notifications: true,
        push_notifications: true,
        two_factor_enabled: false,
      },
    });

    return new Response(
      JSON.stringify({
        id: userId,
        display_name: displayName,
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
