-- Custom domain mapping (additive, non-breaking)
CREATE TABLE IF NOT EXISTS project_domains (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(253) NOT NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  ssl_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  verification_token VARCHAR(64) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_domains_domain (domain),
  KEY idx_project_domains_project (project_id),
  CONSTRAINT fk_project_domains_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
