-- Phase 13: per-project App Manager

CREATE TABLE IF NOT EXISTS project_apps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  app_id VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  settings_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_project_app (project_id, app_id),
  KEY idx_project_apps_project (project_id),
  KEY idx_project_apps_enabled (enabled)
);

