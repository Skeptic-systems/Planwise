CREATE DATABASE IF NOT EXISTS planwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE planwise;

CREATE TABLE IF NOT EXISTS auth_users (
  id CHAR(36) NOT NULL,                -- uuid
  email VARCHAR(255) NULL,
  encrypted_password VARCHAR(255) NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  user_id CHAR(36) NOT NULL,
  is_team_plan TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plans_user_id (user_id),
  CONSTRAINT fk_plans_user FOREIGN KEY (user_id) REFERENCES auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_tabs (
  id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  position INT NOT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plan_tabs_plan_id (plan_id),
  CONSTRAINT fk_plan_tabs_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fields (
  id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  plan_tab_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fields_plan_id (plan_id),
  KEY idx_fields_plan_tab_id (plan_tab_id),
  CONSTRAINT fk_fields_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_fields_plan_tab FOREIGN KEY (plan_tab_id) REFERENCES plan_tabs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignments (
  id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  color TEXT NULL,
  position INT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_plan_id (plan_id),
  KEY idx_assignments_field_id (field_id),
  CONSTRAINT fk_assignments_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_field FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_members (
  id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_members_plan_user (plan_id, user_id),
  KEY idx_plan_members_user_id (user_id),
  CONSTRAINT fk_plan_members_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_members_user FOREIGN KEY (user_id) REFERENCES auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_archive (
  id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  plan_data JSON NOT NULL,
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id CHAR(36) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_plan_archive_plan_id (plan_id),
  KEY idx_plan_archive_user_id (user_id),
  KEY idx_plan_archive_owner_id (owner_id),
  CONSTRAINT fk_plan_archive_plan FOREIGN KEY (plan_id) REFERENCES plans(id),
  CONSTRAINT fk_plan_archive_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_archive_owner FOREIGN KEY (owner_id) REFERENCES auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL,
  display_name TEXT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  theme TEXT NULL DEFAULT 'system',
  language TEXT NULL DEFAULT 'en',
  accent_color TEXT NULL DEFAULT 'blue',
  PRIMARY KEY (id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES auth_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS analytics_events (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  properties JSON NOT NULL,
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  plan_id CHAR(36) NULL,
  PRIMARY KEY (id),
  KEY idx_ae_user_id (user_id),
  KEY idx_ae_plan_id (plan_id),
  CONSTRAINT fk_ae_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ae_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;