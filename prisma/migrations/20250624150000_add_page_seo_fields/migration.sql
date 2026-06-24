-- Page-level SEO columns (additive, idempotent).

SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'seo_title') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `seo_title` VARCHAR(255) NULL AFTER `seo_json`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'seo_description') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `seo_description` VARCHAR(512) NULL AFTER `seo_title`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'seo_keywords') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `seo_keywords` VARCHAR(512) NULL AFTER `seo_description`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'og_image') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `og_image` VARCHAR(2048) NULL AFTER `seo_keywords`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'robots_index') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `robots_index` TINYINT(1) NOT NULL DEFAULT 1 AFTER `og_image`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'robots_follow') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `robots_follow` TINYINT(1) NOT NULL DEFAULT 1 AFTER `robots_index`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'canonical_url') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `canonical_url` VARCHAR(2048) NULL AFTER `robots_follow`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
