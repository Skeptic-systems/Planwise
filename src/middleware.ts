import { defineMiddleware } from "astro:middleware";
import { auth } from "@/auth/auth";

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = new URL(ctx.request.url);

  // Skip middleware for static files and public routes
  if (pathname.includes(".") || pathname === "/" || pathname.startsWith("/api/")) {
    return next();
  }

  // Get session from Better Auth
  const session = await auth.api.getSession({ headers: ctx.request.headers });

  // Store session in locals for access in pages
  ctx.locals.session = session;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/editor", "/archive", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    return ctx.redirect("/login");
  }

  // Redirect authenticated users away from auth pages
  const authPages = ["/login", "/register"];
  if (authPages.includes(pathname) && session) {
    return ctx.redirect("/dashboard");
  }

  return next();
});
