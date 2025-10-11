import { auth } from "@/auth/auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Session API error:", error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
