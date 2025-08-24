// src/pages/api/auth/signin.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email")?.toString();
  const password = form.get("password")?.toString();
  const redirectTo = form.get("redirectTo")?.toString() || "/dashboard";
  if (!email || !password) return new Response("Email and password are required", { status: 400 });

  // Call Better Auth (sets cookies + may respond with JSON)
  const baRes = await auth.api.signInEmail({
    body: { email, password, callbackURL: redirectTo, rememberMe: true },
    asResponse: true,
  });

  // If Better Auth already returned a redirect, just forward it
  if (baRes.status >= 300 && baRes.status < 400) return baRes;

  // Otherwise it returned JSON; extract target url and forward cookies + 303 redirect
  let url = redirectTo;
  try {
    const data = await baRes.clone().json();
    if (data?.url) url = data.url;
  } catch { /* ignore */ }

  const headers = new Headers();
  for (const [k, v] of baRes.headers) {
    if (k.toLowerCase() === "set-cookie") headers.append("Set-Cookie", v);
  }
  headers.set("Location", url);
  return new Response(null, { status: 303, headers });
};
