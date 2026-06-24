-- Multi-project custom-domain routing (additive, idempotent).

SET @db = DATABASE();

-- projects.domain
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'domain') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `domain` VARCHAR(253) NULL AFTER `slug`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND INDEX_NAME = 'uq_projects_domain') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD UNIQUE KEY uq_projects_domain (`domain`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- projects.home_slug
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'home_slug') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `home_slug` VARCHAR(180) NOT NULL DEFAULT ''home'' AFTER `domain`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- projects.status (ACTIVE / ARCHIVED)
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'status') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `status` ENUM(''ACTIVE'',''ARCHIVED'') NOT NULL DEFAULT ''ACTIVE'' AFTER `home_slug`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pages.draft_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'draft_json') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `draft_json` JSON NULL AFTER `status`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pages.published_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'published_json') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `published_json` JSON NULL AFTER `draft_json`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pages.published_at
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'published_at') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `published_at` TIMESTAMP NULL DEFAULT NULL AFTER `published_json`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- site_settings singleton
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(32) NOT NULL DEFAULT 'main',
  active_project_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_site_settings_active_project (active_project_id),
  CONSTRAINT fk_site_settings_active_project
    FOREIGN KEY (active_project_id) REFERENCES projects (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (id, active_project_id)
SELECT 'main', (SELECT id FROM projects WHERE slug = 'dispatch' LIMIT 1);

-- Backfill projects.domain from verified primary project_domains
UPDATE projects pr
INNER JOIN project_domains pd ON pd.project_id = pr.id AND pd.is_primary = 1 AND pd.verified = 1
SET pr.domain = pd.domain
WHERE pr.domain IS NULL OR pr.domain = '';

-- Backfill pages.published_json from live page_versions snapshot
UPDATE pages p
INNER JOIN page_versions pv ON pv.id = p.published_version_id AND pv.status = 'published'
SET p.published_json = pv.snapshot_json,
    p.published_at = COALESCE(p.published_at, pv.created_at)
WHERE p.published_json IS NULL AND pv.snapshot_json IS NOT NULL;

-- Backfill pages.draft_json from latest draft version
UPDATE pages p
INNER JOIN (
  SELECT pv.page_id, pv.snapshot_json
  FROM page_versions pv
  INNER JOIN (
    SELECT page_id, MAX(id) AS max_id
    FROM page_versions
    WHERE status = 'draft'
    GROUP BY page_id
  ) latest ON latest.max_id = pv.id
) d ON d.page_id = p.id
SET p.draft_json = d.snapshot_json
WHERE p.draft_json IS NULL AND d.snapshot_json IS NOT NULL;
