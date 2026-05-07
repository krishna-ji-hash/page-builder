CREATE TABLE page_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id BIGINT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  snapshot_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_versions_page_version (page_id, version_number),
  KEY idx_page_versions_page_status (page_id, status),
  CONSTRAINT fk_page_versions_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE pages
  ADD CONSTRAINT fk_pages_published_version
    FOREIGN KEY (published_version_id) REFERENCES page_versions (id)
    ON DELETE SET NULL;
