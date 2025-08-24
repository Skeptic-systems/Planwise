// src/pages/api/auth/[...all].ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";

export const ALL: APIRoute = async (ctx) => auth.handler(ctx.request);
