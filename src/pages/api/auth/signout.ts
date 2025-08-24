// src/pages/api/auth/signout.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";

export const POST: APIRoute = async ({ request }) => {
  return auth.api.signOut({ headers: request.headers, asResponse: true });
};
