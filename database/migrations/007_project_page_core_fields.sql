-- Core project/page model hardening for multi-project builder engine.
-- Idempotent and safe for existing data.

SET @db = DATABASE();

-- projects.name (keep old projects.title for backwards compatibility)
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'name') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `name` VARCHAR(255) NULL AFTER `slug`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill projects.name from projects.title when missing.
UPDATE projects
SET name = title
WHERE (name IS NULL OR name = '')
  AND title IS NOT NULL
  AND title <> '';

-- Enforce NOT NULL for projects.name after backfill.
SET @sql = (
  SELECT IF(
    (SELECT IS_NULLABLE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'name'
     LIMIT 1) = 'NO',
    'SELECT 1',
    'ALTER TABLE projects MODIFY COLUMN `name` VARCHAR(255) NOT NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pages.status
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'status') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD COLUMN `status` ENUM(\'draft\',\'published\',\'archived\') NOT NULL DEFAULT \'draft\' AFTER `slug`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure unique page slug in same project.
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*)
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'pages'
       AND INDEX_NAME = 'uq_pages_project_slug') > 0,
    'SELECT 1',
    'ALTER TABLE pages ADD UNIQUE KEY uq_pages_project_slug (project_id, slug)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
