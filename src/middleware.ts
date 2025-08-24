// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { auth } from "@/auth/auth";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = new URL(ctx.request.url);

  // allow static & API
  if (pathname === "/" || pathname.startsWith("/api/") || pathname.includes(".")) {
    return next();
  }

  // session via Better Auth
  const session = await auth.api.getSession({ headers: ctx.request.headers });

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/editor") || pathname.startsWith("/settings");

  if (isProtected && !session) return ctx.redirect("/login");

  ctx.locals.user = session?.user ?? null;
  ctx.locals.session = session ?? null;

  return next();
});
