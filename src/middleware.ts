import { defineMiddleware } from "astro:middleware";
import { auth } from "@/auth/auth";
import { ensureSchema } from "@/server/bootstrap/ensureSchema";

export const onRequest = defineMiddleware(async (ctx, next) => {
  try { await ensureSchema(); } catch (e) { console.error("ensureSchema failed", e); }

  const { pathname } = new URL(ctx.request.url);

  if (pathname === "/" || pathname.startsWith("/api/") || pathname.includes(".")) {
    return next();
  }

  const session = await auth.api.getSession({ headers: ctx.request.headers });

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/editor") || pathname.startsWith("/settings");

  if (isProtected && !session) return ctx.redirect("/login");

  ctx.locals.user = session?.user ?? null;
  ctx.locals.session = session ?? null;

  return next();
});
