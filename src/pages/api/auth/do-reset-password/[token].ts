export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";

export const POST: APIRoute = async ({ request, params, redirect }) => {
  const token = params.token;
  const form = await request.formData();
  const password = form.get("password")?.toString();
  if (!token || !password) return new Response("Missing token or password", { status: 400 });

  const res = await auth.api.resetPassword({ body: { token, newPassword: password }, asResponse: true });
  if (res.ok) return redirect("/login?reset=success");
  return res;
};
