/**
 * Republish battle project home pages from fixtures (content/style_json refresh).
 * Does not delete projects — replaces draft tree + published snapshot for listed slugs.
 *
 * Usage: npm run battle-test:refresh-content
 */

import mysql from 'mysql2/promise';
import { BATTLE_PROJECTS } from '../battle-testing/fixtures/battleProjects.mjs';

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function buildSnapshotTree(rows) {
  const byId = new Map();
  for (const node of rows) {
    const props = parseJson(node.props_json) || {};
    byId.set(node.id, {
      id: node.id,
      nodeType: node.node_type,
      displayName: node.display_name || '',
      positionIndex: Number(node.position_index) || 0,
      props,
      style_json: props.style_json,
      dataJson: parseJson(node.data_json),
      actionsJson: parseJson(node.actions_json),
      children: [],
    });
  }
  const roots = [];
  for (const node of rows) {
    const el = byId.get(node.id);
    const p = node.parent_node_id;
    if (!p) roots.push(el);
    else {
      const parent = byId.get(p);
      if (parent) parent.children.push(el);
    }
  }
  const sortKids = (n) => {
    n.children.sort((a, b) => a.positionIndex - b.positionIndex);
    n.children.forEach(sortKids);
  };
  roots.sort((a, b) => a.positionIndex - b.positionIndex);
  roots.forEach(sortKids);
  return roots;
}

async function insertNode(connection, { pageId, versionId, parentId, nodeType, displayName, props, positionIndex, dataJson, actionsJson }) {
  const propsClean = props && typeof props === 'object' ? props : {};
  if (!propsClean.style_json) propsClean.style_json = {};
  const [res] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pageId,
      versionId,
      parentId,
      nodeType,
      displayName || nodeType,
      JSON.stringify(propsClean),
      positionIndex ?? 0,
      dataJson ? JSON.stringify(dataJson) : null,
      actionsJson ? JSON.stringify(actionsJson) : null,
    ]
  );
  return res.insertId;
}

async function insertSubtree(connection, pageId, versionId, parentId, spec, positionIndex) {
  const props = { ...(spec.props || {}) };
  const id = await insertNode(connection, {
    pageId,
    versionId,
    parentId,
    nodeType: spec.nodeType,
    displayName: spec.displayName,
    props,
    positionIndex,
    dataJson: spec.dataJson ?? null,
    actionsJson: spec.actionsJson ?? null,
  });
  const kids = Array.isArray(spec.children) ? spec.children : [];
  for (let i = 0; i < kids.length; i += 1) {
    await insertSubtree(connection, pageId, versionId, id, kids[i], i);
  }
  return id;
}

async function refreshSnapshot(connection, versionId) {
  const [rows] = await connection.query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes WHERE version_id = ?
     ORDER BY id ASC`,
    [versionId]
  );
  const tree = buildSnapshotTree(rows);
  await connection.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [
    JSON.stringify({ nodes: tree }),
    versionId,
  ]);
}

/** Pages to refresh from fixtures (slug → fixture page plan). */
const REFRESH_PAGE_SLUGS = new Set([
  'home',
  'austin-luxury-homes',
  'summer-sale',
  'cross-border-freight',
  'property-detail',
  'product-detail',
  'blog-post',
]);

async function refreshPageFromFixture(connection, projectId, pagePlan) {
  const [pages] = await connection.query(
    `SELECT id, published_version_id FROM pages WHERE project_id = ? AND slug = ? LIMIT 1`,
    [projectId, pagePlan.slug]
  );
  if (!pages.length) {
    process.stdout.write(`  [skip] page ${pagePlan.slug} not found\n`);
    return false;
  }
  const pageId = pages[0].id;
  let versionId = pages[0].published_version_id;

  const [draftRows] = await connection.query(
    `SELECT id FROM page_versions WHERE page_id = ? AND status = 'draft' ORDER BY version_number DESC LIMIT 1`,
    [pageId]
  );
  if (draftRows.length) versionId = draftRows[0].id;
  if (!versionId) {
    process.stdout.write(`  [skip] ${pagePlan.slug} — no version\n`);
    return false;
  }

  await connection.query(`DELETE FROM builder_nodes WHERE version_id = ?`, [versionId]);
  const roots = pagePlan.sections || [];
  for (let i = 0; i < roots.length; i += 1) {
    await insertSubtree(connection, pageId, versionId, null, roots[i], i);
  }
  await refreshSnapshot(connection, versionId);

  if (pages[0].published_version_id) {
    await connection.query(`UPDATE page_versions SET status = 'published' WHERE id = ?`, [versionId]);
    await connection.query(
      `UPDATE pages SET published_version_id = ?, status = 'published', seo_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [versionId, JSON.stringify(pagePlan.seo || {}), pageId]
    );
  }

  process.stdout.write(`  [ok] refreshed ${pagePlan.slug} (version ${versionId})\n`);
  return true;
}

async function refreshCmsImages(connection, projectId, plan) {
  for (const item of plan.cmsItems || []) {
    const [cols] = await connection.query(
      `SELECT id FROM cms_collections WHERE project_id = ? AND slug = ? LIMIT 1`,
      [projectId, item.collectionSlug]
    );
    if (!cols.length) continue;
    await connection.query(
      `UPDATE cms_items SET data_json = ? WHERE collection_id = ? AND slug = ?`,
      [JSON.stringify(item.data || {}), cols[0].id, item.slug]
    );
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE || 'documents',
    multipleStatements: false,
  });

  try {
    for (const plan of BATTLE_PROJECTS) {
      const [rows] = await connection.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [plan.slug]);
      if (!rows.length) {
        process.stdout.write(`Skip ${plan.slug} — not seeded\n`);
        continue;
      }
      const projectId = rows[0].id;
      process.stdout.write(`\n${plan.slug} (id ${projectId})\n`);
      await refreshCmsImages(connection, projectId, plan);
      for (const pagePlan of plan.pages || []) {
        if (!REFRESH_PAGE_SLUGS.has(pagePlan.slug)) continue;
        await refreshPageFromFixture(connection, projectId, pagePlan);
      }
    }
    process.stdout.write('\nDone.\n');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
