// src/pages/api/auth/register.ts
export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { supabase } from "@/lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  // read form fields from your register form
  const form = await request.formData();
  const email = form.get("email")?.toString()?.trim();
  const password = form.get("password")?.toString();
  const displayName = form.get("displayName")?.toString()?.trim() || "User";
  const redirectTo = form.get("redirectTo")?.toString() || "/login?registered=1";

  if (!email || !password) return new Response("Email and password are required", { status: 400 });

  // call Better Auth to sign up (sets cookies if auto sign-in is enabled)
  const baRes = await auth.api.signUpEmail({
    body: { email, password, name: displayName, callbackURL: redirectTo },
    asResponse: true,
  });

  // try to mirror the BA user into your app tables (auth_users, profiles)
  try {
    const data = await baRes.clone().json().catch(() => null) as any;
    const baUser = data?.user || data?.data?.user;
    const userId: string | undefined = baUser?.id;
    if (userId) {
      // upsert into auth_users
      const { data: existing } = await supabase.from("auth_users").select("id").eq("id", userId).single();
      if (!existing) {
        await supabase.from("auth_users").insert([{ id: userId, email, encrypted_password: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
      }
      // upsert into profiles
      const { data: prof } = await supabase.from("profiles").select("id").eq("id", userId).single();
      if (!prof) {
        await supabase.from("profiles").insert([{
          id: userId,
          display_name: displayName,
          theme: "system",
          language: "en",
          accent_color: "blue",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      }
    }
  } catch {
    // keep silent; signup should not fail due to mirroring
  }

  // if BA already responded with a redirect, forward it as-is
  if (baRes.status >= 300 && baRes.status < 400) return baRes;

  // otherwise forward Set-Cookie and do our own redirect
  let url = redirectTo;
  try {
    const payload = await baRes.clone().json();
    if (payload?.url) url = payload.url;
  } catch { /* ignore */ }

  const headers = new Headers();
  for (const [k, v] of baRes.headers) {
    if (k.toLowerCase() === "set-cookie") headers.append("Set-Cookie", v);
  }
  headers.set("Location", url);
  return new Response(null, { status: 303, headers });
};
