CREATE TABLE IF NOT EXISTS global_components (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  current_revision INT NOT NULL DEFAULT 1,
  snapshot_json JSON NOT NULL,
  linked_pages_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_global_components_project (project_id, id),
  CONSTRAINT fk_global_components_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS global_component_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  component_id BIGINT UNSIGNED NOT NULL,
  revision INT NOT NULL,
  snapshot_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_component_revision (component_id, revision),
  INDEX idx_component_rev_component (component_id, revision),
  CONSTRAINT fk_component_revs_component FOREIGN KEY (component_id) REFERENCES global_components(id) ON DELETE CASCADE
);

