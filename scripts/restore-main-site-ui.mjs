/**
 * Restore main-site home UI from the dispatch project's full published page.
 * Usage: node --env-file=.env scripts/restore-main-site-ui.mjs
 */
import { withTransaction } from '../lib/db.js';

const SOURCE_PROJECT_SLUG = 'dispatch';
const TARGET_PROJECT_SLUG = 'main-site';
const PAGE_SLUG = 'home';

async function getProjectPage(connection, projectSlug) {
  const [rows] = await connection.query(
    `SELECT p.id AS page_id, p.published_version_id, p.project_id, pr.config_json
     FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     WHERE pr.slug = ? AND p.slug = ?
     LIMIT 1`,
    [projectSlug, PAGE_SLUG]
  );
  return rows[0] || null;
}

async function getDraftVersionId(connection, pageId) {
  const [rows] = await connection.query(
    `SELECT id FROM page_versions
     WHERE page_id = ? AND status = 'draft'
     ORDER BY id DESC LIMIT 1`,
    [pageId]
  );
  return rows[0]?.id || null;
}

async function getPublishedSnapshot(connection, publishedVersionId) {
  const [rows] = await connection.query(
    `SELECT snapshot_json FROM page_versions WHERE id = ? LIMIT 1`,
    [publishedVersionId]
  );
  let snap = rows[0]?.snapshot_json;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch {
      snap = null;
    }
  }
  return snap;
}

async function copyBuilderNodes(connection, srcPageId, srcVersionId, dstPageId, dstVersionId) {
  await connection.query(`DELETE FROM builder_nodes WHERE page_id = ? AND version_id = ?`, [
    dstPageId,
    dstVersionId,
  ]);

  const [nodes] = await connection.query(
    `SELECT id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes
     WHERE page_id = ? AND version_id = ?
     ORDER BY id ASC`,
    [srcPageId, srcVersionId]
  );

  const idMap = new Map();
  for (const node of nodes) {
    const parentId = node.parent_node_id ? idMap.get(Number(node.parent_node_id)) ?? null : null;
    const propsJson =
      typeof node.props_json === 'string' ? node.props_json : JSON.stringify(node.props_json || {});
    const [insert] = await connection.query(
      `INSERT INTO builder_nodes
        (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dstPageId,
        dstVersionId,
        parentId,
        node.node_type,
        node.display_name,
        propsJson,
        node.position_index ?? 0,
        node.data_json ?? null,
        node.actions_json ?? null,
      ]
    );
    idMap.set(Number(node.id), insert.insertId);
  }

  return nodes.length;
}

async function refreshDraftSnapshot(connection, versionId, pageId) {
  const [nodes] = await connection.query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes WHERE version_id = ? ORDER BY position_index ASC, id ASC`,
    [versionId]
  );

  const byParent = new Map();
  for (const node of nodes) {
    const key = node.parent_node_id ? String(node.parent_node_id) : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(node);
  }

  const build = (parentKey) =>
    (byParent.get(parentKey) || []).map((node) => {
      let props = node.props_json;
      if (typeof props === 'string') {
        try {
          props = JSON.parse(props);
        } catch {
          props = {};
        }
      }
      return {
        id: String(node.id),
        nodeType: node.node_type,
        displayName: node.display_name,
        positionIndex: node.position_index ?? 0,
        props: props || {},
        children: build(String(node.id)),
      };
    });

  const tree = build('root');
  const snapshot = { nodes: tree };
  const snapshotJson = JSON.stringify(snapshot);

  await connection.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [
    snapshotJson,
    versionId,
  ]);
  await connection.query(
    `UPDATE pages SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [snapshotJson, pageId]
  );

  return tree.length;
}

async function main() {
  const result = await withTransaction(async (connection) => {
    const source = await getProjectPage(connection, SOURCE_PROJECT_SLUG);
    const target = await getProjectPage(connection, TARGET_PROJECT_SLUG);

    if (!source) throw new Error(`Source project/page not found: ${SOURCE_PROJECT_SLUG}/${PAGE_SLUG}`);
    if (!target) throw new Error(`Target project/page not found: ${TARGET_PROJECT_SLUG}/${PAGE_SLUG}`);
    if (!source.published_version_id) {
      throw new Error('Dispatch home has no published version');
    }

    const publishedSnapshot = await getPublishedSnapshot(connection, source.published_version_id);
    if (!publishedSnapshot?.nodes?.length) {
      throw new Error('Dispatch published snapshot is empty');
    }

    const sourceDraftId = await getDraftVersionId(connection, source.page_id);
    const targetDraftId = await getDraftVersionId(connection, target.page_id);
    if (!sourceDraftId || !targetDraftId) {
      throw new Error('Missing draft version on source or target page');
    }

    const sourceConfig =
      typeof source.config_json === 'string'
        ? JSON.parse(source.config_json)
        : source.config_json || {};
    await connection.query(`UPDATE projects SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
      JSON.stringify(sourceConfig),
      target.project_id,
    ]);

    const copiedNodes = await copyBuilderNodes(
      connection,
      source.page_id,
      sourceDraftId,
      target.page_id,
      targetDraftId
    );
    await refreshDraftSnapshot(connection, targetDraftId, target.page_id);

    const publishSnapshotJson = JSON.stringify(publishedSnapshot);
    const [versionRows] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_v FROM page_versions WHERE page_id = ?`,
      [target.page_id]
    );
    const nextVersion = Number(versionRows[0]?.next_v || 1);

    await connection.query(
      `UPDATE page_versions SET status = 'archived' WHERE page_id = ? AND status = 'published'`,
      [target.page_id]
    );

    const [insertPublished] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, ?, 'published', ?)`,
      [target.page_id, nextVersion, publishSnapshotJson]
    );
    const publishedVersionId = insertPublished.insertId;

    await connection.query(
      `UPDATE pages
       SET published_version_id = ?, status = 'published',
           published_json = ?, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [publishedVersionId, publishSnapshotJson, target.page_id]
    );

    return {
      copiedNodes,
      publishedNodes: publishedSnapshot.nodes.length,
      publishedVersionId,
      targetPageId: target.page_id,
    };
  });

  console.log('Restored main-site home UI from dispatch:');
  console.log(`  builder nodes copied: ${result.copiedNodes}`);
  console.log(`  published rows: ${result.publishedNodes}`);
  console.log(`  page id: ${result.targetPageId}`);
  console.log(`  published version: ${result.publishedVersionId}`);
  console.log(`\nOpen ${process.env.SITE_URL || 'http://localhost:3000'}/ — full UI should load.`);
}

main().catch((error) => {
  console.error('Restore failed:', error.message);
  process.exit(1);
});
