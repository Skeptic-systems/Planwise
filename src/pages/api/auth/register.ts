export const prerender = false;
import type { APIRoute } from "astro";
import { auth } from "@/auth/auth";
import { db } from "@/lib/db";

const MIN_PW_LEN = 8;

async function upsertAuthUser(id: string, email: string) {
  await db.query(
    `INSERT INTO auth_users (id, email, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE email = VALUES(email), updated_at = NOW()`,
    [id, email]
  );
}

async function upsertProfile(id: string, displayName: string) {
  await db.query(
    `INSERT INTO profiles (id, display_name, theme, language, accent_color)
     VALUES (?, ?, 'system', 'en', 'blue')
     ON DUPLICATE KEY UPDATE display_name = COALESCE(display_name, VALUES(display_name))`,
    [id, displayName || "User"]
  );
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email")?.toString()?.trim() || "";
  const password = form.get("password")?.toString() || "";
  const displayName = form.get("displayName")?.toString()?.trim() || "User";
  const redirectTo = form.get("redirectTo")?.toString() || "/dashboard";

  if (!email || !password) return new Response("Email and password are required", { status: 400 });
  if (password.length < MIN_PW_LEN) return new Response("Password is too short", { status: 400 });

  const signUpRes = await auth.api.signUpEmail({
    body: { email, password, name: displayName, callbackURL: redirectTo },
    asResponse: true,
  });

  if (!signUpRes.ok) {
    let msg = "Sign up failed";
    try { const j = await signUpRes.clone().json(); msg = j?.message || j?.error || msg; } catch {}
    return new Response(msg, { status: signUpRes.status || 400 });
  }

  const setCookie: string[] = [];
  for (const [k, v] of signUpRes.headers) if (k.toLowerCase() === "set-cookie") setCookie.push(v);

  let baUserId: string | null = null;
  try {
    const payload = await signUpRes.clone().json();
    baUserId = payload?.user?.id || payload?.data?.user?.id || null;
  } catch {
    const rows: any[] = await db.query("SELECT id FROM user WHERE email = ? ORDER BY createdAt DESC LIMIT 1", [email]); 
    baUserId = rows?.[0]?.id || null;
  }
  if (!baUserId) return new Response("Could not resolve user id after sign up", { status: 500 });

  await upsertAuthUser(baUserId, email);
  await upsertProfile(baUserId, displayName);

  const hasSessionCookie = setCookie.some(c => /session|auth/i.test(c));
  if (!hasSessionCookie) {
    const signInRes = await auth.api.signInEmail({
      body: { email, password, callbackURL: redirectTo, rememberMe: true },
      asResponse: true,
    });
    for (const [k, v] of signInRes.headers) if (k.toLowerCase() === "set-cookie") setCookie.push(v);
  }

  const headers = new Headers();
  for (const c of setCookie) headers.append("Set-Cookie", c);
  headers.set("Location", redirectTo);
  return new Response(null, { status: 303, headers });
};
