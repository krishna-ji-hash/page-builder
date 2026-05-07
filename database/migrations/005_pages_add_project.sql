ALTER TABLE pages
  ADD COLUMN project_id BIGINT UNSIGNED NULL AFTER id;

UPDATE pages p
INNER JOIN projects pr ON pr.slug = 'default'
SET p.project_id = pr.id
WHERE p.project_id IS NULL;

ALTER TABLE pages
  MODIFY COLUMN project_id BIGINT UNSIGNED NOT NULL;

ALTER TABLE pages
  ADD CONSTRAINT fk_pages_project
    FOREIGN KEY (project_id) REFERENCES projects (id);

ALTER TABLE pages
  DROP INDEX uq_pages_slug;

ALTER TABLE pages
  ADD UNIQUE KEY uq_pages_project_slug (project_id, slug);
