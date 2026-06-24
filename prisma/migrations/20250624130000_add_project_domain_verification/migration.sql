-- Project domain verification status (additive, idempotent).

SET @db = DATABASE();

-- projects.domain_status
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'domain_status') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `domain_status` ENUM(''PENDING'',''VERIFIED'',''FAILED'') NOT NULL DEFAULT ''PENDING'' AFTER `domain`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- projects.last_verified_at
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'last_verified_at') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `last_verified_at` TIMESTAMP NULL DEFAULT NULL AFTER `domain_status`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill VERIFIED where legacy project_domains already verified the primary domain
UPDATE projects pr
INNER JOIN project_domains pd
  ON pd.project_id = pr.id
  AND pd.is_primary = 1
  AND pd.verified = 1
  AND pd.domain = pr.domain
SET pr.domain_status = 'VERIFIED',
    pr.last_verified_at = COALESCE(pr.last_verified_at, pd.last_checked_at, pd.updated_at, NOW())
WHERE pr.domain IS NOT NULL
  AND pr.domain != ''
  AND pr.domain_status = 'PENDING';
