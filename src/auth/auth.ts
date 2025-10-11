import { pool } from "@/lib/mysql";
// src/auth/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: pool,
  telemetry: { enabled: false },
  cookies: {
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    httpOnly: true,
    path: "/",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 Tage
    updateAge: 60 * 60 * 24, // 1 Tag
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      console.log(`[BetterAuth] Reset link for ${user.email}: ${url}`);
    },
  },
});
