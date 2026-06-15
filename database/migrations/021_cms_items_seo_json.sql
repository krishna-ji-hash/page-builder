-- Enterprise SEO: per CMS item SEO overrides
-- Idempotent

SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'cms_items' AND COLUMN_NAME = 'seo_json') > 0,
    'SELECT 1',
    'ALTER TABLE cms_items ADD COLUMN `seo_json` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
