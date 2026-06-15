-- Domain verification audit fields (additive, idempotent)

SET @db = DATABASE();

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'project_domains' AND COLUMN_NAME = 'last_checked_at') > 0,
    'SELECT 1',
    'ALTER TABLE project_domains ADD COLUMN last_checked_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'project_domains' AND COLUMN_NAME = 'verification_error') > 0,
    'SELECT 1',
    'ALTER TABLE project_domains ADD COLUMN verification_error VARCHAR(512) NULL DEFAULT NULL AFTER last_checked_at'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
