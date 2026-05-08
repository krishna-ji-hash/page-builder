-- Phase 12: CMS Collections & Dynamic Content System
-- MySQL / MariaDB migration

CREATE TABLE IF NOT EXISTS cms_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'custom',
  schema_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_project_collection_slug (project_id, slug),
  KEY idx_cms_collections_project (project_id)
);

CREATE TABLE IF NOT EXISTS cms_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  collection_id INT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  slug VARCHAR(180) NOT NULL,
  title VARCHAR(220) NULL,
  data_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  UNIQUE KEY uniq_collection_item_slug (collection_id, slug),
  KEY idx_cms_items_collection (collection_id),
  KEY idx_cms_items_status (status),
  KEY idx_cms_items_published_at (published_at)
);

