/**
 * Battle Testing Phase — seed four production-style projects into MySQL.
 *
 * Usage: npm run battle-test:seed
 * Requires: npm run db:migrate (and MySQL per .env like scripts/seed.mjs)
 *
 * Idempotent: skips any project whose slug already exists.
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
  const dataJson = spec.dataJson ?? null;
  const actionsJson = spec.actionsJson ?? null;
  const id = await insertNode(connection, {
    pageId,
    versionId,
    parentId,
    nodeType: spec.nodeType,
    displayName: spec.displayName,
    props,
    positionIndex,
    dataJson,
    actionsJson,
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
  await connection.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [JSON.stringify({ nodes: tree }), versionId]);
}

async function seedPage(connection, projectId, pagePlan) {
  const [pIns] = await connection.query(
    `INSERT INTO pages (project_id, title, slug, status, published_version_id, seo_json)
     VALUES (?, ?, ?, 'draft', NULL, ?)`,
    [projectId, pagePlan.title, pagePlan.slug, JSON.stringify(pagePlan.seo || {})]
  );
  const pageId = pIns.insertId;

  const [vIns] = await connection.query(
    `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
     VALUES (?, 1, 'draft', ?)`,
    [pageId, JSON.stringify({ nodes: [] })]
  );
  const versionId = vIns.insertId;

  const roots = pagePlan.sections || [];
  for (let i = 0; i < roots.length; i += 1) {
    await insertSubtree(connection, pageId, versionId, null, roots[i], i);
  }

  await refreshSnapshot(connection, versionId);

  await connection.query(`UPDATE page_versions SET status = 'published' WHERE id = ?`, [versionId]);
  await connection.query(
    `UPDATE pages SET published_version_id = ?, status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [versionId, pageId]
  );

  return { pageId, versionId };
}

/** Add any battle pages missing from an existing project (idempotent; no destructive reset). */
async function ensureMissingBattlePages(connection, projectId, plan) {
  const added = [];
  for (const pagePlan of plan.pages || []) {
    const [rows] = await connection.query(
      `SELECT id FROM pages WHERE project_id = ? AND slug = ? LIMIT 1`,
      [projectId, pagePlan.slug]
    );
    if (rows.length) continue;
    await seedPage(connection, projectId, pagePlan);
    added.push(pagePlan.slug);
  }
  return added;
}

async function seedProject(connection, plan) {
  const [exist] = await connection.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [plan.slug]);
  if (exist.length) {
    const projectId = exist[0].id;
    const patched = await ensureMissingBattlePages(connection, projectId, plan);
    if (patched.length) {
      process.stdout.write(`Patched "${plan.slug}" (project ${projectId}) — added pages: ${patched.join(', ')}\n`);
    } else {
      process.stdout.write(`Skip "${plan.slug}" — already exists (project id ${projectId}).\n`);
    }
    return null;
  }

  const [prIns] = await connection.query(
    `INSERT INTO projects (name, title, slug, type, config_json)
     VALUES (?, ?, ?, ?, ?)`,
    [plan.name, plan.name, plan.slug, plan.type || 'website', JSON.stringify(plan.configJson || {})]
  );
  const projectId = prIns.insertId;

  for (const appId of plan.appIds || []) {
    await connection.query(`INSERT INTO project_apps (project_id, app_id, enabled) VALUES (?, ?, 1)`, [projectId, appId]);
  }

  const collectionIdBySlug = new Map();
  for (const col of plan.cmsCollections || []) {
    const [cIns] = await connection.query(
      `INSERT INTO cms_collections (project_id, name, slug, type, schema_json)
       VALUES (?, ?, ?, 'custom', ?)`,
      [projectId, col.name, col.slug, JSON.stringify(col.schema || { fields: [] })]
    );
    collectionIdBySlug.set(col.slug, cIns.insertId);
  }

  for (const item of plan.cmsItems || []) {
    const cid = collectionIdBySlug.get(item.collectionSlug);
    if (!cid) continue;
    await connection.query(
      `INSERT INTO cms_items (collection_id, status, slug, title, data_json, published_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [cid, item.status || 'published', item.slug, item.title || '', JSON.stringify(item.data || {})]
    );
  }

  const pagesOut = [];
  for (const pagePlan of plan.pages || []) {
    pagesOut.push(await seedPage(connection, projectId, pagePlan));
  }

  process.stdout.write(
    `Seeded "${plan.slug}" (project ${projectId}) — pages: ${pagesOut.map((p) => p.pageId).join(', ')}\n`
  );
  return { projectId, pages: pagesOut };
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
      await seedProject(connection, plan);
    }
    process.stdout.write('Battle-test seed finished.\n');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
