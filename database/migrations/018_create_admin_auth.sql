-- Admin authentication (additive, non-breaking)
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(128) NOT NULL DEFAULT '',
  role ENUM('super_admin', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email),
  KEY idx_admin_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45) NULL DEFAULT NULL,
  user_agent VARCHAR(512) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_sessions_token (token_hash),
  KEY idx_admin_sessions_user (user_id),
  KEY idx_admin_sessions_expires (expires_at),
  CONSTRAINT fk_admin_sessions_user
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project-scoped access for admin / editor / viewer roles
CREATE TABLE IF NOT EXISTS admin_user_projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_user_projects (user_id, project_id),
  KEY idx_admin_user_projects_project (project_id),
  CONSTRAINT fk_admin_user_projects_user
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_admin_user_projects_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
