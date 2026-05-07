START TRANSACTION;

INSERT INTO pages (project_id, slug, title)
SELECT pr.id, 'home', 'Home Page'
FROM projects pr
WHERE pr.slug = 'default'
LIMIT 1
ON DUPLICATE KEY UPDATE title = VALUES(title);

SET @page_id := (
  SELECT p.id
  FROM pages p
  INNER JOIN projects pr ON pr.id = p.project_id
  WHERE pr.slug = 'default' AND p.slug = 'home'
  LIMIT 1
);

DELETE FROM builder_nodes WHERE page_id = @page_id;
DELETE FROM page_versions WHERE page_id = @page_id;

SET @snapshot := JSON_OBJECT(
  'nodes', JSON_ARRAY(
    JSON_OBJECT(
      'id', 'seed-row-1',
      'nodeType', 'row',
      'displayName', 'Hero Row',
      'positionIndex', 0,
      'props', JSON_OBJECT('gap', 16),
      'children', JSON_ARRAY(
        JSON_OBJECT(
          'id', 'seed-col-1',
          'nodeType', 'column',
          'displayName', 'Main Column',
          'positionIndex', 0,
          'props', JSON_OBJECT('width', '100%'),
          'children', JSON_ARRAY(
            JSON_OBJECT(
              'id', 'seed-stack-1',
              'nodeType', 'stack',
              'displayName', 'Hero Stack',
              'positionIndex', 0,
              'props', JSON_OBJECT('direction', 'vertical', 'gap', 12),
              'children', JSON_ARRAY(
                JSON_OBJECT(
                  'id', 'seed-heading-1',
                  'nodeType', 'heading',
                  'displayName', 'Hero Heading',
                  'positionIndex', 0,
                  'props', JSON_OBJECT('text', 'Build Faster With Your Own Platform', 'tag', 'h1'),
                  'children', JSON_ARRAY()
                )
              )
            )
          )
        )
      )
    )
  )
);

INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
VALUES (@page_id, 1, 'published', @snapshot);
SET @version_id := LAST_INSERT_ID();

UPDATE pages
SET published_version_id = @version_id
WHERE id = @page_id;

INSERT INTO builder_nodes (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index)
VALUES (@page_id, @version_id, NULL, 'row', 'Hero Row', JSON_OBJECT('gap', 16), 0);
SET @row_id := LAST_INSERT_ID();

INSERT INTO builder_nodes (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index)
VALUES (@page_id, @version_id, @row_id, 'column', 'Main Column', JSON_OBJECT('width', '100%'), 0);
SET @column_id := LAST_INSERT_ID();

INSERT INTO builder_nodes (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index)
VALUES (@page_id, @version_id, @column_id, 'stack', 'Hero Stack', JSON_OBJECT('direction', 'vertical', 'gap', 12), 0);
SET @stack_id := LAST_INSERT_ID();

INSERT INTO builder_nodes (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index)
VALUES (
  @page_id,
  @version_id,
  @stack_id,
  'heading',
  'Hero Heading',
  JSON_OBJECT('text', 'Build Faster With Your Own Platform', 'tag', 'h1'),
  0
);

COMMIT;
