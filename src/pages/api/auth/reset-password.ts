// src/pages/api/auth/reset-password.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";

export const POST: APIRoute = async ({ request, url }) => {
  const body = await request.json().catch(() => null);
  const email = body?.email?.toString().trim();
  if (!email) return new Response("Email required", { status: 400 });

  const base = `${url.protocol}//${url.host}`; // e.g. http://localhost:4321
  // Better Auth expects callbackURL for reset
  return auth.api.requestPasswordReset({
    body: { email, callbackURL: `${base}/reset-password` },
    asResponse: true,
  });
};
