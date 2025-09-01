import "dotenv/config";
import mysql from "mysql2/promise";

function cfg() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "planwise",
  };
}

const CREATE = {
  user: `CREATE TABLE IF NOT EXISTS \`user\` (
    id varchar(36) NOT NULL,
    name text NOT NULL,
    email varchar(255) NOT NULL,
    emailVerified tinyint(1) NOT NULL,
    image text DEFAULT NULL,
    createdAt datetime NOT NULL DEFAULT current_timestamp(),
    updatedAt datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id), UNIQUE KEY email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  account: `CREATE TABLE IF NOT EXISTS \`account\` (
    id varchar(36) NOT NULL,
    accountId text NOT NULL,
    providerId text NOT NULL,
    userId varchar(36) NOT NULL,
    accessToken text DEFAULT NULL,
    refreshToken text DEFAULT NULL,
    idToken text DEFAULT NULL,
    accessTokenExpiresAt datetime DEFAULT NULL,
    refreshTokenExpiresAt datetime DEFAULT NULL,
    scope text DEFAULT NULL,
    password text DEFAULT NULL,
    createdAt datetime NOT NULL,
    updatedAt datetime NOT NULL,
    PRIMARY KEY (id), KEY userId (userId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  session: `CREATE TABLE IF NOT EXISTS \`session\` (
    id varchar(36) NOT NULL,
    expiresAt datetime NOT NULL,
    token varchar(255) NOT NULL,
    createdAt datetime NOT NULL,
    updatedAt datetime NOT NULL,
    ipAddress text DEFAULT NULL,
    userAgent text DEFAULT NULL,
    userId varchar(36) NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY token (token), KEY userId (userId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  verification: `CREATE TABLE IF NOT EXISTS \`verification\` (
    id varchar(36) NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expiresAt datetime NOT NULL,
    createdAt datetime DEFAULT current_timestamp(),
    updatedAt datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  auth_users: `CREATE TABLE IF NOT EXISTS \`auth_users\` (
    id char(36) NOT NULL,
    email varchar(255) DEFAULT NULL,
    encrypted_password varchar(255) DEFAULT NULL,
    created_at datetime DEFAULT NULL,
    updated_at datetime DEFAULT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  profiles: `CREATE TABLE IF NOT EXISTS \`profiles\` (
    id char(36) NOT NULL,
    display_name text DEFAULT NULL,
    created_at datetime DEFAULT current_timestamp(),
    updated_at datetime DEFAULT current_timestamp(),
    theme text DEFAULT 'system',
    language text DEFAULT 'en',
    accent_color text DEFAULT 'blue',
    email_notifications tinyint(1) NOT NULL DEFAULT 1,
    push_notifications tinyint(1) NOT NULL DEFAULT 1,
    two_factor_enabled tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  plans: `CREATE TABLE IF NOT EXISTS \`plans\` (
    id char(36) NOT NULL,
    title text NOT NULL,
    description text DEFAULT NULL,
    user_id char(36) NOT NULL,
    is_team_plan tinyint(1) NOT NULL DEFAULT 0,
    created_at datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id), KEY idx_plans_user_id (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  plan_tabs: `CREATE TABLE IF NOT EXISTS \`plan_tabs\` (
    id char(36) NOT NULL,
    plan_id char(36) NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    position int(11) NOT NULL,
    created_at datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id), KEY idx_plan_tabs_plan_id (plan_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  fields: `CREATE TABLE IF NOT EXISTS \`fields\` (
    id char(36) NOT NULL,
    plan_id char(36) NOT NULL,
    plan_tab_id char(36) NOT NULL,
    name text NOT NULL,
    created_at datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id), KEY idx_fields_plan_id (plan_id), KEY idx_fields_plan_tab_id (plan_tab_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  assignments: `CREATE TABLE IF NOT EXISTS \`assignments\` (
    id char(36) NOT NULL,
    plan_id char(36) NOT NULL,
    field_id char(36) NOT NULL,
    name text NOT NULL,
    email text DEFAULT NULL,
    start_time datetime NOT NULL,
    end_time datetime NOT NULL,
    color text DEFAULT NULL,
    position int(11) DEFAULT NULL,
    created_at datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id), KEY idx_assignments_plan_id (plan_id), KEY idx_assignments_field_id (field_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  plan_members: `CREATE TABLE IF NOT EXISTS \`plan_members\` (
    id char(36) NOT NULL,
    plan_id char(36) NOT NULL,
    user_id char(36) NOT NULL,
    role text NOT NULL,
    created_at datetime DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_plan_members_plan_user (plan_id, user_id),
    KEY idx_plan_members_user_id (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  plan_archive: `CREATE TABLE IF NOT EXISTS \`plan_archive\` (
    id char(36) NOT NULL,
    plan_id char(36) NOT NULL,
    plan_data longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    archived_at datetime NOT NULL DEFAULT current_timestamp(),
    user_id char(36) NOT NULL,
    owner_id char(36) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_plan_archive_plan_id (plan_id),
    KEY idx_plan_archive_user_id (user_id),
    KEY idx_plan_archive_owner_id (owner_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  analytics_events: `CREATE TABLE IF NOT EXISTS \`analytics_events\` (
    id char(36) NOT NULL,
    user_id char(36) DEFAULT NULL,
    name varchar(255) NOT NULL,
    properties longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    created_at datetime DEFAULT current_timestamp(),
    plan_id char(36) DEFAULT NULL,
    PRIMARY KEY (id), KEY idx_ae_user_id (user_id), KEY idx_ae_plan_id (plan_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
};

const FK = [
  { t: "account", n: "account_ibfk_1", sql: "ALTER TABLE `account` ADD CONSTRAINT `account_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE" },
  { t: "session", n: "session_ibfk_1", sql: "ALTER TABLE `session` ADD CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE" },
  { t: "plans", n: "fk_plans_user", sql: "ALTER TABLE `plans` ADD CONSTRAINT `fk_plans_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`)" },
  { t: "plan_tabs", n: "fk_plan_tabs_plan", sql: "ALTER TABLE `plan_tabs` ADD CONSTRAINT `fk_plan_tabs_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE" },
  { t: "fields", n: "fk_fields_plan", sql: "ALTER TABLE `fields` ADD CONSTRAINT `fk_fields_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE" },
  { t: "fields", n: "fk_fields_plan_tab", sql: "ALTER TABLE `fields` ADD CONSTRAINT `fk_fields_plan_tab` FOREIGN KEY (`plan_tab_id`) REFERENCES `plan_tabs` (`id`) ON DELETE CASCADE" },
  { t: "assignments", n: "fk_assignments_plan", sql: "ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE" },
  { t: "assignments", n: "fk_assignments_field", sql: "ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE" },
  { t: "plan_members", n: "fk_plan_members_plan", sql: "ALTER TABLE `plan_members` ADD CONSTRAINT `fk_plan_members_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE" },
  { t: "plan_members", n: "fk_plan_members_user", sql: "ALTER TABLE `plan_members` ADD CONSTRAINT `fk_plan_members_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`)" },
  { t: "plan_archive", n: "fk_plan_archive_plan", sql: "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)" },
  { t: "plan_archive", n: "fk_plan_archive_user", sql: "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE" },
  { t: "plan_archive", n: "fk_plan_archive_owner", sql: "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_owner` FOREIGN KEY (`owner_id`) REFERENCES `auth_users` (`id`)" },
  { t: "profiles", n: "fk_profiles_user", sql: "ALTER TABLE `profiles` ADD CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `auth_users` (`id`)" },
  { t: "analytics_events", n: "fk_ae_plan", sql: "ALTER TABLE `analytics_events` ADD CONSTRAINT `fk_ae_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE" },
  { t: "analytics_events", n: "fk_ae_user", sql: "ALTER TABLE `analytics_events` ADD CONSTRAINT `fk_ae_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE" },
];

async function connNoDB(c, fn) { const db = await mysql.createConnection(c); try { return await fn(db); } finally { await db.end(); } }
async function connDB(c, fn)  { const db = await mysql.createConnection(c); try { return await fn(db); } finally { await db.end(); } }

async function hasFK(db, table, name) {
  const [r] = await db.query(
    "SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? LIMIT 1",
    [table, name]
  );
  return r.length > 0;
}
async function hasTrigger(db, name) {
  const [r] = await db.query(
    "SELECT 1 FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ? LIMIT 1",
    [name]
  );
  return r.length > 0;
}
async function ensureTable(db, name) { await db.query(CREATE[name]); }
async function normalizeEngine(db, name) {
  try {
    await db.query(`ALTER TABLE \`${name}\` ENGINE=InnoDB`);
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || "";
    if (msg.includes("Tablespace is missing") || e.code === "ER_ERROR_ON_RENAME") {
      await db.query(`DROP TABLE IF EXISTS \`${name}\``);
      await ensureTable(db, name);
    } else {
      throw e;
    }
  }
}
async function addFKWithRepair(db, fk) {
  if (await hasFK(db, fk.t, fk.n)) return;
  try {
    await db.query(fk.sql);
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || "";
    if (msg.includes("Tablespace is missing") || e.code === "ER_ERROR_ON_RENAME" || e.errno === 150) {
      const child = fk.t;
      const m = fk.sql.match(/REFERENCES\s+`([^`]+)`/i);
      const parent = m ? m[1] : null;
      if (parent) await normalizeEngine(db, parent);
      await normalizeEngine(db, child);
      await db.query(fk.sql);
    } else {
      throw e;
    }
  }
}

async function run() {
  const c = cfg();
  await connNoDB({ host: c.host, port: c.port, user: c.user, password: c.password }, async (db) => { await db.query("SELECT 1"); });
  await connNoDB({ host: c.host, port: c.port, user: c.user, password: c.password }, async (db) => { await db.query(`CREATE DATABASE IF NOT EXISTS \`${c.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); });
  await connDB({ host: c.host, port: c.port, user: c.user, password: c.password, database: c.database, multipleStatements: true }, async (db) => {
    await db.query("SET SESSION foreign_key_checks=0");
    const order = ["user","auth_users","plans","plan_tabs","fields","assignments","plan_members","plan_archive","analytics_events","profiles","account","session","verification"];
    for (const t of order) await ensureTable(db, t);
    for (const t of order) await normalizeEngine(db, t);
    for (const fk of FK) await addFKWithRepair(db, fk);
    if (!(await hasTrigger(db, "trg_profiles_set_updated_at"))) {
      await db.query("DROP TRIGGER IF EXISTS `trg_profiles_set_updated_at`");
      await db.query("CREATE TRIGGER `trg_profiles_set_updated_at` BEFORE UPDATE ON `profiles` FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP");
    }
    await db.query("SET SESSION foreign_key_checks=1");
  });
  console.log("[db:push] schema ensured successfully");
}

run().catch((e) => { console.error("[db:push] failed", e); process.exit(1); });
