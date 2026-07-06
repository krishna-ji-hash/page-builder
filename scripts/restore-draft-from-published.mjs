/**
 * Reset draft to match published (live) content when builder canvas diverged.
 *
 * Usage:
 *   node --env-file=.env scripts/restore-draft-from-published.mjs --project d --slug home
 *   node --env-file=.env scripts/restore-draft-from-published.mjs --project d
 */
import { getDbPool, closeDbPool, withTransaction } from '../lib/db.js';

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const opts = { project: null, slug: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--project') opts.project = argv[++i] || null;
    else if (argv[i] === '--slug') opts.slug = argv[++i] || null;
  }
  return opts;
}

async function insertSubtree(connection, { pageId, versionId, parentId, spec, positionIndex }) {
  const props = { ...(spec.props || {}) };
  if (!props.style_json && spec.style_json) props.style_json = spec.style_json;
  const [res] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pageId,
      versionId,
      parentId,
      spec.nodeType || 'stack',
      spec.displayName || spec.nodeType || 'stack',
      JSON.stringify(props),
      positionIndex ?? 0,
      spec.dataJson ? JSON.stringify(spec.dataJson) : null,
      spec.actionsJson ? JSON.stringify(spec.actionsJson) : null,
    ],
  );
  const id = res.insertId;
  const kids = Array.isArray(spec.children) ? spec.children : [];
  for (let i = 0; i < kids.length; i += 1) {
    await insertSubtree(connection, {
      pageId,
      versionId,
      parentId: id,
      spec: kids[i],
      positionIndex: kids[i]?.positionIndex ?? i,
    });
  }
  return id;
}

async function restorePage(connection, page) {
  if (!page.published_version_id) {
    return { restored: false, reason: 'not-published' };
  }

  const [pubRows] = await connection.query(
    'SELECT snapshot_json FROM page_versions WHERE id = ? LIMIT 1',
    [page.published_version_id],
  );
  const publishedSnapshot = parseJson(pubRows[0]?.snapshot_json) || { nodes: [] };
  const publishedRoots = Array.isArray(publishedSnapshot.nodes) ? publishedSnapshot.nodes : [];
  if (!publishedRoots.length) {
    return { restored: false, reason: 'empty-published' };
  }

  let [draftRows] = await connection.query(
    `SELECT id FROM page_versions WHERE page_id = ? AND status = 'draft' ORDER BY version_number DESC LIMIT 1`,
    [page.id],
  );
  let draftId = draftRows[0]?.id;

  if (!draftId) {
    const [pubMeta] = await connection.query(
      'SELECT version_number FROM page_versions WHERE id = ? LIMIT 1',
      [page.published_version_id],
    );
    const [insertVer] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, ?, 'draft', ?)`,
      [page.id, Number(pubMeta[0]?.version_number || 0) + 1, JSON.stringify(publishedSnapshot)],
    );
    draftId = insertVer.insertId;
  } else {
    await connection.query(
      `UPDATE page_versions SET snapshot_json = ? WHERE id = ?`,
      [JSON.stringify(publishedSnapshot), draftId],
    );
    await connection.query('DELETE FROM builder_nodes WHERE version_id = ?', [draftId]);
  }

  for (let i = 0; i < publishedRoots.length; i += 1) {
    await insertSubtree(connection, {
      pageId: page.id,
      versionId: draftId,
      parentId: null,
      spec: publishedRoots[i],
      positionIndex: publishedRoots[i]?.positionIndex ?? i,
    });
  }

  const draftSnapshot = { nodes: publishedRoots };
  await connection.query(
    `UPDATE page_versions SET snapshot_json = ? WHERE id = ?`,
    [JSON.stringify(draftSnapshot), draftId],
  );
  await connection.query(
    `UPDATE pages SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [JSON.stringify(draftSnapshot), page.id],
  );

  return {
    restored: true,
    draftVersionId: draftId,
    publishedVersionId: page.published_version_id,
    rootCount: publishedRoots.length,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pool = getDbPool();
  const clauses = [];
  const params = [];
  if (opts.project) {
    clauses.push('pr.slug = ?');
    params.push(opts.project);
  }
  if (opts.slug) {
    clauses.push('p.slug = ?');
    params.push(opts.slug);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [pages] = await pool.query(
    `SELECT p.id, p.slug, p.published_version_id, pr.slug AS project_slug
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     ${where}
     ORDER BY pr.slug, p.slug`,
    params,
  );

  if (!pages.length) {
    console.log('[restore] No pages matched.');
    await closeDbPool();
    return;
  }

  let restored = 0;
  for (const page of pages) {
    const result = await withTransaction((connection) => restorePage(connection, page));
    console.log(
      `[restore] ${page.project_slug}/${page.slug}:`,
      result.restored
        ? `draft v${result.draftVersionId} ← published v${result.publishedVersionId} (${result.rootCount} sections)`
        : result.reason,
    );
    if (result.restored) restored += 1;
  }

  console.log(`[restore] Done. ${restored} page(s) restored. Refresh builder (Ctrl+Shift+R).`);
  await closeDbPool();
}

main().catch((err) => {
  console.error('[restore] Failed:', err?.message || err);
  process.exit(1);
});
