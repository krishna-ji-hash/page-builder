-- Phase 14: page-level SEO storage
-- Idempotent

SET @db = DATABASE();

-- pages.seo_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'seo_json') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `seo_json` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

