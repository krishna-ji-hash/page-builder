-- SEO redirect manager (project-scoped)
-- Idempotent

SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'seo_redirects') > 0,
    'SELECT 1',
    'CREATE TABLE seo_redirects (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      project_id BIGINT UNSIGNED NOT NULL,
      source_path VARCHAR(512) NOT NULL,
      destination_path VARCHAR(512) NOT NULL,
      redirect_type ENUM(\'301\', \'302\') NOT NULL DEFAULT \'301\',
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_seo_redirect_project_source (project_id, source_path),
      KEY idx_seo_redirect_project_active (project_id, active),
      CONSTRAINT fk_seo_redirect_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
