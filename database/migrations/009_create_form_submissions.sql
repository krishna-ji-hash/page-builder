CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  page_id BIGINT UNSIGNED NOT NULL,
  form_node_id VARCHAR(96) NOT NULL,
  submission_json JSON NOT NULL,
  meta_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_submissions_project (project_id),
  INDEX idx_form_submissions_page (page_id),
  INDEX idx_form_submissions_form (form_node_id),
  CONSTRAINT fk_form_submissions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_form_submissions_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);
