-- WordPress-style page revisions (additive, idempotent).
-- Table `page_revisions` — separate from legacy `page_versions` used by builder_nodes.

CREATE TABLE IF NOT EXISTS page_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id BIGINT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  snapshot_json JSON NOT NULL,
  source ENUM('DRAFT_SAVE', 'PUBLISH', 'RESTORE') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_revisions_page_version (page_id, version_number),
  KEY idx_page_revisions_page_created (page_id, created_at),
  CONSTRAINT fk_page_revisions_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_page_revisions_created_by
    FOREIGN KEY (created_by_id) REFERENCES admin_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
