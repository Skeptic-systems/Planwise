import "dotenv/config";
import mysql from "mysql2/promise";

function readCfg() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = +(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "planwise";
  return { host, port, user, password, database };
}

async function run() {
  const cfg = readCfg();
  const c = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password });
  try {
    await c.query(`DROP DATABASE IF EXISTS \`${cfg.database}\``);
    console.log(`[db:drop] dropped ${cfg.database}`);
  } finally {
    await c.end();
  }
}
run().catch((e) => { console.error("[db:drop] failed", e); process.exit(1); });
