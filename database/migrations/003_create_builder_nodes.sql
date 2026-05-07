CREATE TABLE builder_nodes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id BIGINT UNSIGNED NOT NULL,
  version_id BIGINT UNSIGNED NOT NULL,
  parent_node_id BIGINT UNSIGNED NULL,
  node_type VARCHAR(64) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  props_json JSON NOT NULL,
  position_index INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_builder_nodes_version (version_id, position_index),
  KEY idx_builder_nodes_parent (parent_node_id),
  CONSTRAINT fk_builder_nodes_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_builder_nodes_version
    FOREIGN KEY (version_id) REFERENCES page_versions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_builder_nodes_parent
    FOREIGN KEY (parent_node_id) REFERENCES builder_nodes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
