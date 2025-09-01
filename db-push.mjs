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


async function withConnNoDB(cfg, fn) {
  const c = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password });
  try { return await fn(c); } finally { await c.end(); }
}
async function withConnDB(cfg, fn) {
  const c = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database });
  try { return await fn(c); } finally { await c.end(); }
}
async function hasFK(db, table, name) {
  const [rows] = await db.query("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? LIMIT 1", [table, name]);
  return rows.length > 0;
}
async function hasTrigger(db, name) {
  const [rows] = await db.query("SELECT 1 FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ? LIMIT 1", [name]);
  return rows.length > 0;
}

async function run() {
  const cfg = readCfg();
  console.log(`[db:push] using ${cfg.user}@${cfg.host}:${cfg.port} db=${cfg.database}`);

  await withConnNoDB(cfg, async (c) => { await c.query("SELECT 1"); });
  await withConnNoDB(cfg, async (c) => {
    await c.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  });

  await withConnDB(cfg, async (db) => {
    const q = (sql, p = []) => db.query(sql, p);
    await q(`CREATE TABLE IF NOT EXISTS \`user\` (id varchar(36) NOT NULL, name text NOT NULL, email varchar(255) NOT NULL, emailVerified tinyint(1) NOT NULL, image text DEFAULT NULL, createdAt datetime NOT NULL DEFAULT current_timestamp(), updatedAt datetime NOT NULL DEFAULT current_timestamp(), PRIMARY KEY (id), UNIQUE KEY email (email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`account\` (id varchar(36) NOT NULL, accountId text NOT NULL, providerId text NOT NULL, userId varchar(36) NOT NULL, accessToken text DEFAULT NULL, refreshToken text DEFAULT NULL, idToken text DEFAULT NULL, accessTokenExpiresAt datetime DEFAULT NULL, refreshTokenExpiresAt datetime DEFAULT NULL, scope text DEFAULT NULL, password text DEFAULT NULL, createdAt datetime NOT NULL, updatedAt datetime NOT NULL, PRIMARY KEY (id), KEY userId (userId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`session\` (id varchar(36) NOT NULL, expiresAt datetime NOT NULL, token varchar(255) NOT NULL, createdAt datetime NOT NULL, updatedAt datetime NOT NULL, ipAddress text DEFAULT NULL, userAgent text DEFAULT NULL, userId varchar(36) NOT NULL, PRIMARY KEY (id), UNIQUE KEY token (token), KEY userId (userId)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`verification\` (id varchar(36) NOT NULL, identifier text NOT NULL, value text NOT NULL, expiresAt datetime NOT NULL, createdAt datetime DEFAULT current_timestamp(), updatedAt datetime DEFAULT current_timestamp(), PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await q(`CREATE TABLE IF NOT EXISTS \`auth_users\` (id char(36) NOT NULL, email varchar(255) DEFAULT NULL, encrypted_password varchar(255) DEFAULT NULL, created_at datetime DEFAULT NULL, updated_at datetime DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`profiles\` (id char(36) NOT NULL, display_name text DEFAULT NULL, created_at datetime DEFAULT current_timestamp(), updated_at datetime DEFAULT current_timestamp(), theme text DEFAULT 'system', language text DEFAULT 'en', accent_color text DEFAULT 'blue', email_notifications tinyint(1) NOT NULL DEFAULT 1, push_notifications tinyint(1) NOT NULL DEFAULT 1, two_factor_enabled tinyint(1) NOT NULL DEFAULT 0, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`plans\` (id char(36) NOT NULL, title text NOT NULL, description text DEFAULT NULL, user_id char(36) NOT NULL, is_team_plan tinyint(1) NOT NULL DEFAULT 0, created_at datetime DEFAULT current_timestamp(), PRIMARY KEY (id), KEY idx_plans_user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`plan_tabs\` (id char(36) NOT NULL, plan_id char(36) NOT NULL, name text NOT NULL, type text NOT NULL, position int(11) NOT NULL, created_at datetime DEFAULT current_timestamp(), PRIMARY KEY (id), KEY idx_plan_tabs_plan_id (plan_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`fields\` (id char(36) NOT NULL, plan_id char(36) NOT NULL, plan_tab_id char(36) NOT NULL, name text NOT NULL, created_at datetime DEFAULT current_timestamp(), PRIMARY KEY (id), KEY idx_fields_plan_id (plan_id), KEY idx_fields_plan_tab_id (plan_tab_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`assignments\` (id char(36) NOT NULL, plan_id char(36) NOT NULL, field_id char(36) NOT NULL, name text NOT NULL, email text DEFAULT NULL, start_time datetime NOT NULL, end_time datetime NOT NULL, color text DEFAULT NULL, position int(11) DEFAULT NULL, created_at datetime DEFAULT current_timestamp(), PRIMARY KEY (id), KEY idx_assignments_plan_id (plan_id), KEY idx_assignments_field_id (field_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`plan_members\` (id char(36) NOT NULL, plan_id char(36) NOT NULL, user_id char(36) NOT NULL, role text NOT NULL, created_at datetime DEFAULT current_timestamp(), PRIMARY KEY (id), UNIQUE KEY uq_plan_members_plan_user (plan_id, user_id), KEY idx_plan_members_user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`plan_archive\` (id char(36) NOT NULL, plan_id char(36) NOT NULL, plan_data longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL, archived_at datetime NOT NULL DEFAULT current_timestamp(), user_id char(36) NOT NULL, owner_id char(36) NOT NULL, PRIMARY KEY (id), KEY idx_plan_archive_plan_id (plan_id), KEY idx_plan_archive_user_id (user_id), KEY idx_plan_archive_owner_id (owner_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    await q(`CREATE TABLE IF NOT EXISTS \`analytics_events\` (id char(36) NOT NULL, user_id char(36) DEFAULT NULL, name varchar(255) NOT NULL, properties longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL, created_at datetime DEFAULT current_timestamp(), plan_id char(36) DEFAULT NULL, PRIMARY KEY (id), KEY idx_ae_user_id (user_id), KEY idx_ae_plan_id (plan_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // --- FKs (guarded) ---
    const addFK = async (t, n, sql) => { if (!(await hasFK(db, t, n))) await q(sql); };

    await addFK("account", "account_ibfk_1", "ALTER TABLE `account` ADD CONSTRAINT `account_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE");
    await addFK("session", "session_ibfk_1", "ALTER TABLE `session` ADD CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE");

    await addFK("plans", "fk_plans_user", "ALTER TABLE `plans` ADD CONSTRAINT `fk_plans_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`)");
    await addFK("plan_tabs", "fk_plan_tabs_plan", "ALTER TABLE `plan_tabs` ADD CONSTRAINT `fk_plan_tabs_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE");

    await addFK("fields", "fk_fields_plan", "ALTER TABLE `fields` ADD CONSTRAINT `fk_fields_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE");
    await addFK("fields", "fk_fields_plan_tab", "ALTER TABLE `fields` ADD CONSTRAINT `fk_fields_plan_tab` FOREIGN KEY (`plan_tab_id`) REFERENCES `plan_tabs` (`id`) ON DELETE CASCADE");

    await addFK("assignments", "fk_assignments_plan", "ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE");
    await addFK("assignments", "fk_assignments_field", "ALTER TABLE `assignments` ADD CONSTRAINT `fk_assignments_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE");

    await addFK("plan_members", "fk_plan_members_plan", "ALTER TABLE `plan_members` ADD CONSTRAINT `fk_plan_members_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE");
    await addFK("plan_members", "fk_plan_members_user", "ALTER TABLE `plan_members` ADD CONSTRAINT `fk_plan_members_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`)");

    await addFK("plan_archive", "fk_plan_archive_plan", "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)");
    await addFK("plan_archive", "fk_plan_archive_user", "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE");
    await addFK("plan_archive", "fk_plan_archive_owner", "ALTER TABLE `plan_archive` ADD CONSTRAINT `fk_plan_archive_owner` FOREIGN KEY (`owner_id`) REFERENCES `auth_users` (`id`)");

    await addFK("profiles", "fk_profiles_user", "ALTER TABLE `profiles` ADD CONSTRAINT `fk_profiles_user` FOREIGN KEY (`id`) REFERENCES `auth_users` (`id`)");
    await addFK("analytics_events", "fk_ae_plan", "ALTER TABLE `analytics_events` ADD CONSTRAINT `fk_ae_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE");
    await addFK("analytics_events", "fk_ae_user", "ALTER TABLE `analytics_events` ADD CONSTRAINT `fk_ae_user` FOREIGN KEY (`user_id`) REFERENCES `auth_users` (`id`) ON DELETE CASCADE");
    if (!(await hasTrigger(db, "trg_profiles_set_updated_at"))) {
      await q("DROP TRIGGER IF EXISTS `trg_profiles_set_updated_at`");
      await q("CREATE TRIGGER `trg_profiles_set_updated_at` BEFORE UPDATE ON `profiles` FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP");
    }
  });

  console.log("[db:push] schema ensured successfully");
}

run().catch((e) => { console.error("[db:push] failed", e); process.exit(1); });
