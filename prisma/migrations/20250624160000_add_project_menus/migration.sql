-- WordPress-style project menus (additive).

CREATE TABLE IF NOT EXISTS menus (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  location ENUM('HEADER', 'FOOTER') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menus_project_location (project_id, location),
  CONSTRAINT fk_menus_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(180) NOT NULL,
  url VARCHAR(2048) NOT NULL DEFAULT '',
  page_id BIGINT UNSIGNED NULL,
  target VARCHAR(16) NOT NULL DEFAULT '_self',
  sort_order INT NOT NULL DEFAULT 0,
  parent_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_menu_items_menu_sort (menu_id, sort_order),
  KEY idx_menu_items_parent (parent_id),
  CONSTRAINT fk_menu_items_menu
    FOREIGN KEY (menu_id) REFERENCES menus (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_menu_items_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_menu_items_parent
    FOREIGN KEY (parent_id) REFERENCES menu_items (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
