-- Admin activity audit trail (additive, non-breaking)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL DEFAULT NULL,
  project_id BIGINT UNSIGNED NULL DEFAULT NULL,
  page_id BIGINT UNSIGNED NULL DEFAULT NULL,
  action VARCHAR(64) NOT NULL,
  metadata_json JSON NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_activity_created (created_at),
  KEY idx_admin_activity_project (project_id, created_at),
  KEY idx_admin_activity_user (user_id, created_at),
  KEY idx_admin_activity_action (action, created_at),
  CONSTRAINT fk_admin_activity_user
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_admin_activity_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_admin_activity_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
