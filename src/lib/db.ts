import "dotenv/config";
import { createPool } from "mysql2/promise";

const env = (k: string, d?: string) => process.env[k] ?? d;

export const db = createPool({
  host: env("DB_HOST", "127.0.0.1"),
  port: Number(env("DB_PORT", "3306")),
  user: env("DB_USER")!,
  password: env("DB_PASSWORD")!,
  database: env("DB_NAME")!,
  connectionLimit: 10,
});
