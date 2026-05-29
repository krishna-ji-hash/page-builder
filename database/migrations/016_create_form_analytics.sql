CREATE TABLE IF NOT EXISTS form_analytics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  page_id BIGINT UNSIGNED NULL,
  form_node_id VARCHAR(96) NOT NULL,
  event_type ENUM('view', 'start', 'submit') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_analytics_project (project_id),
  INDEX idx_form_analytics_form (form_node_id),
  INDEX idx_form_analytics_event (event_type),
  CONSTRAINT fk_form_analytics_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
