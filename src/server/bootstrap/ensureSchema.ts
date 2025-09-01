import { db } from "@/lib/db";
declare global {
  var __PLANWISE_SCHEMA_ENSURED__: boolean | undefined;
}
if (global.__PLANWISE_SCHEMA_ENSURED__ === undefined) global.__PLANWISE_SCHEMA_ENSURED__ = false;

async function hasIndex(table: string, index: string) {
  const [rows]: any = await (db as any).query(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1",
    [table, index]
  );
  return rows.length > 0;
}
async function hasConstraint(table: string, constraint: string) {
  const [rows]: any = await (db as any).query(
    "SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? LIMIT 1",
    [table, constraint]
  );
  return rows.length > 0;
}
async function hasTrigger(name: string) {
  const [rows]: any = await (db as any).query(
    "SELECT 1 FROM information_schema.triggers WHERE trigger_schema = DATABASE() AND trigger_name = ? LIMIT 1",
    [name]
  );
  return rows.length > 0;
}

async function ensureTables() {
  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS user (
      id varchar(36) NOT NULL,
      name text NOT NULL,
      email varchar(255) NOT NULL,
      emailVerified tinyint(1) NOT NULL,
      image text DEFAULT NULL,
      createdAt datetime NOT NULL DEFAULT current_timestamp(),
      updatedAt datetime NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `); 

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS account (
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
      PRIMARY KEY (id),
      KEY userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `); 

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS session (
      id varchar(36) NOT NULL,
      expiresAt datetime NOT NULL,
      token varchar(255) NOT NULL,
      createdAt datetime NOT NULL,
      updatedAt datetime NOT NULL,
      ipAddress text DEFAULT NULL,
      userAgent text DEFAULT NULL,
      userId varchar(36) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY token (token),
      KEY userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS verification (
      id varchar(36) NOT NULL,
      identifier text NOT NULL,
      value text NOT NULL,
      expiresAt datetime NOT NULL,
      createdAt datetime DEFAULT current_timestamp(),
      updatedAt datetime DEFAULT current_timestamp(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id char(36) NOT NULL,
      email varchar(255) DEFAULT NULL,
      encrypted_password varchar(255) DEFAULT NULL,
      created_at datetime DEFAULT NULL,
      updated_at datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS profiles (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS plans (
      id char(36) NOT NULL,
      title text NOT NULL,
      description text DEFAULT NULL,
      user_id char(36) NOT NULL,
      is_team_plan tinyint(1) NOT NULL DEFAULT 0,
      created_at datetime DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_plans_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS plan_tabs (
      id char(36) NOT NULL,
      plan_id char(36) NOT NULL,
      name text NOT NULL,
      type text NOT NULL,
      position int(11) NOT NULL,
      created_at datetime DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_plan_tabs_plan_id (plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS fields (
      id char(36) NOT NULL,
      plan_id char(36) NOT NULL,
      plan_tab_id char(36) NOT NULL,
      name text NOT NULL,
      created_at datetime DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_fields_plan_id (plan_id),
      KEY idx_fields_plan_tab_id (plan_tab_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS assignments (
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
      PRIMARY KEY (id),
      KEY idx_assignments_plan_id (plan_id),
      KEY idx_assignments_field_id (field_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS plan_members (
      id char(36) NOT NULL,
      plan_id char(36) NOT NULL,
      user_id char(36) NOT NULL,
      role text NOT NULL,
      created_at datetime DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_plan_members_plan_user (plan_id, user_id),
      KEY idx_plan_members_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS plan_archive (
      id char(36) NOT NULL,
      plan_id char(36) NOT NULL,
      plan_data longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(plan_data)),
      archived_at datetime NOT NULL DEFAULT current_timestamp(),
      user_id char(36) NOT NULL,
      owner_id char(36) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_plan_archive_plan_id (plan_id),
      KEY idx_plan_archive_user_id (user_id),
      KEY idx_plan_archive_owner_id (owner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);

  await (db as any).query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id char(36) NOT NULL,
      user_id char(36) DEFAULT NULL,
      name varchar(255) NOT NULL,
      properties longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(properties)),
      created_at datetime DEFAULT current_timestamp(),
      plan_id char(36) DEFAULT NULL,
      PRIMARY KEY (id),
      KEY idx_ae_user_id (user_id),
      KEY idx_ae_plan_id (plan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
  `);
}

async function ensureForeignKeys() {
  const fks: Array<{table:string; name:string; sql:string; cite?: string}> = [
    { table: "account", name: "account_ibfk_1", sql: "ALTER TABLE account ADD CONSTRAINT account_ibfk_1 FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE" }, // :contentReference[oaicite:19]{index=19}
    { table: "session", name: "session_ibfk_1", sql: "ALTER TABLE session ADD CONSTRAINT session_ibfk_1 FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE" }, // :contentReference[oaicite:20]{index=20}
    { table: "plans", name: "fk_plans_user", sql: "ALTER TABLE plans ADD CONSTRAINT fk_plans_user FOREIGN KEY (user_id) REFERENCES auth_users (id)" }, // :contentReference[oaicite:21]{index=21}
    { table: "plan_tabs", name: "fk_plan_tabs_plan", sql: "ALTER TABLE plan_tabs ADD CONSTRAINT fk_plan_tabs_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE" }, // :contentReference[oaicite:22]{index=22}
    { table: "fields", name: "fk_fields_plan", sql: "ALTER TABLE fields ADD CONSTRAINT fk_fields_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE" }, // :contentReference[oaicite:23]{index=23}
    { table: "fields", name: "fk_fields_plan_tab", sql: "ALTER TABLE fields ADD CONSTRAINT fk_fields_plan_tab FOREIGN KEY (plan_tab_id) REFERENCES plan_tabs (id) ON DELETE CASCADE" }, // :contentReference[oaicite:24]{index=24}
    { table: "assignments", name: "fk_assignments_plan", sql: "ALTER TABLE assignments ADD CONSTRAINT fk_assignments_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE" }, // :contentReference[oaicite:25]{index=25}
    { table: "assignments", name: "fk_assignments_field", sql: "ALTER TABLE assignments ADD CONSTRAINT fk_assignments_field FOREIGN KEY (field_id) REFERENCES fields (id) ON DELETE CASCADE" }, // :contentReference[oaicite:26]{index=26}
    { table: "plan_members", name: "fk_plan_members_plan", sql: "ALTER TABLE plan_members ADD CONSTRAINT fk_plan_members_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE" }, // :contentReference[oaicite:27]{index=27}
    { table: "plan_members", name: "fk_plan_members_user", sql: "ALTER TABLE plan_members ADD CONSTRAINT fk_plan_members_user FOREIGN KEY (user_id) REFERENCES auth_users (id)" }, // :contentReference[oaicite:28]{index=28}
    { table: "plan_archive", name: "fk_plan_archive_plan", sql: "ALTER TABLE plan_archive ADD CONSTRAINT fk_plan_archive_plan FOREIGN KEY (plan_id) REFERENCES plans (id)" }, // :contentReference[oaicite:29]{index=29}
    { table: "plan_archive", name: "fk_plan_archive_user", sql: "ALTER TABLE plan_archive ADD CONSTRAINT fk_plan_archive_user FOREIGN KEY (user_id) REFERENCES auth_users (id) ON DELETE CASCADE" }, // :contentReference[oaicite:30]{index=30}
    { table: "plan_archive", name: "fk_plan_archive_owner", sql: "ALTER TABLE plan_archive ADD CONSTRAINT fk_plan_archive_owner FOREIGN KEY (owner_id) REFERENCES auth_users (id)" }, // :contentReference[oaicite:31]{index=31}
    { table: "profiles", name: "fk_profiles_user", sql: "ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES auth_users (id)" }, // :contentReference[oaicite:32]{index=32}
    { table: "analytics_events", name: "fk_ae_plan", sql: "ALTER TABLE analytics_events ADD CONSTRAINT fk_ae_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE" }, // :contentReference[oaicite:33]{index=33}
    { table: "analytics_events", name: "fk_ae_user", sql: "ALTER TABLE analytics_events ADD CONSTRAINT fk_ae_user FOREIGN KEY (user_id) REFERENCES auth_users (id) ON DELETE CASCADE" } // :contentReference[oaicite:34]{index=34}
  ];
  for (const fk of fks) {
    if (!(await hasConstraint(fk.table, fk.name))) {
      await (db as any).query(fk.sql);
    }
  }
}

async function ensureTriggers() {
  const trgName = "trg_profiles_set_updated_at";
  if (!(await hasTrigger(trgName))) {
    await (db as any).query(`DROP TRIGGER IF EXISTS ${trgName}`);
    await (db as any).query(`
      CREATE TRIGGER ${trgName}
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      BEGIN
        SET NEW.updated_at = CURRENT_TIMESTAMP;
      END
    `);
  }
}

export async function ensureSchema() {
  if (global.__PLANWISE_SCHEMA_ENSURED__) return;
  await ensureTables();
  await ensureForeignKeys();
  await ensureTriggers();
  global.__PLANWISE_SCHEMA_ENSURED__ = true;
}
