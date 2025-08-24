// src/auth/auth.ts
import "dotenv/config";
import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

const env = (k: string, d?: string) => process.env[k] ?? d;

const pool = createPool({
  host: env("DB_HOST", "127.0.0.1"),
  port: Number(env("DB_PORT", "3306")),
  user: env("DB_USER")!,         // required
  password: env("DB_PASSWORD")!, // required
  database: env("DB_NAME")!,     // required
  connectionLimit: 10,
});

export const auth = betterAuth({
  database: pool,
  telemetry: { enabled: false }, // optional
  cookies: { secure: env("AUTH_COOKIE_SECURE", "false") === "true" }, // false for http://localhost
  emailAndPassword: {
    enabled: true,
    // <-- THIS enables the reset flow
    async sendResetPassword({ user, url /*, token*/ }) {
      // dev helper: view link in server log
      console.log(`[BetterAuth] Reset link for ${user.email}: ${url}`);
    },
    // optional: token lifetime (seconds)
    // resetPasswordTokenExpiresIn: 3600,
  },
});
