import mysql from "mysql2/promise";

// Parse DATABASE_URL or fall back to individual env vars
const DATABASE_URL = process.env.DATABASE_URL;
let config: any;

if (DATABASE_URL) {
  // Parse mysql://user:pass@host:port/database
  const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    config = {
      host: match[3],
      port: Number.parseInt(match[4], 10),
      user: match[1],
      password: match[2],
      database: match[5],
      multipleStatements: false,
      charset: "utf8mb4",
    };
  } else {
    throw new Error("Invalid DATABASE_URL format");
  }
} else {
  // Fallback to individual env vars
  config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "pass",
    database: process.env.DB_NAME || "planwise",
    multipleStatements: false,
    charset: "utf8mb4",
  };
}

// Create MySQL connection pool for Better Auth
export const pool = mysql.createPool(config);
