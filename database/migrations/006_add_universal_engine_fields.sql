-- Universal builder: project type/config, node data/actions JSON.
-- Idempotent: safe to run if columns already exist (dev / manual re-run).

SET @db = DATABASE();

-- projects.type
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'type') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `type` ENUM(\'website\',\'dashboard\',\'admin\',\'app\') NOT NULL DEFAULT \'website\''
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- projects.config_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'config_json') > 0,
    'SELECT 1',
    'ALTER TABLE projects ADD COLUMN `config_json` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- builder_nodes.data_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'builder_nodes' AND COLUMN_NAME = 'data_json') > 0,
    'SELECT 1',
    'ALTER TABLE builder_nodes ADD COLUMN `data_json` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- builder_nodes.actions_json
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'builder_nodes' AND COLUMN_NAME = 'actions_json') > 0,
    'SELECT 1',
    'ALTER TABLE builder_nodes ADD COLUMN `actions_json` JSON NULL'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
