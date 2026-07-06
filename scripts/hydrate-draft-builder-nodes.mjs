/**
 * Hydrate empty draft `builder_nodes` from `page_versions.snapshot_json`.
 * Run when builder opens blank but live site shows sections.
 *
 * Usage: node --env-file=.env scripts/hydrate-draft-builder-nodes.mjs
 *        node --env-file=.env scripts/hydrate-draft-builder-nodes.mjs --project dispatch
 */
import { getDbPool, closeDbPool, withTransaction } from '../lib/db.js';

function parseJson(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const opts = { project: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--project') opts.project = argv[++i] || null;
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

async function hydratePage(connection, page) {
  let [draftRows] = await connection.query(
    `SELECT id, snapshot_json FROM page_versions
     WHERE page_id = ? AND status = 'draft'
     ORDER BY version_number DESC LIMIT 1`,
    [page.id],
  );

  let draft = draftRows[0];
  if (!draft && page.published_version_id) {
    const [pubRows] = await connection.query(
      'SELECT id, version_number, snapshot_json FROM page_versions WHERE id = ? LIMIT 1',
      [page.published_version_id],
    );
    const pub = pubRows[0];
    if (!pub) return { hydrated: false, reason: 'no-version' };
    const snap = parseJson(pub.snapshot_json) || { nodes: [] };
    const [insertVer] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, ?, 'draft', ?)`,
      [page.id, Number(pub.version_number) + 1, JSON.stringify(snap)],
    );
    draft = { id: insertVer.insertId, snapshot_json: snap };
  }

  if (!draft) return { hydrated: false, reason: 'no-draft' };

  const [countRows] = await connection.query(
    'SELECT COUNT(*) AS total FROM builder_nodes WHERE version_id = ?',
    [draft.id],
  );
  if (Number(countRows[0]?.total || 0) > 0) {
    return { hydrated: false, reason: 'already-has-nodes', draftVersionId: draft.id };
  }

  const snapshot = parseJson(draft.snapshot_json) || { nodes: [] };
  const roots = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
  if (!roots.length) return { hydrated: false, reason: 'empty-snapshot', draftVersionId: draft.id };

  for (let i = 0; i < roots.length; i += 1) {
    await insertSubtree(connection, {
      pageId: page.id,
      versionId: draft.id,
      parentId: null,
      spec: roots[i],
      positionIndex: roots[i]?.positionIndex ?? i,
    });
  }

  return { hydrated: true, draftVersionId: draft.id, rootCount: roots.length };
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
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [pages] = await pool.query(
    `SELECT p.id, p.slug, p.published_version_id, pr.slug AS project_slug
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     ${where}
     ORDER BY pr.slug, p.slug`,
    params,
  );

  let hydrated = 0;
  for (const page of pages) {
    const result = await withTransaction((connection) => hydratePage(connection, page));
    console.log(
      `[hydrate] ${page.project_slug}/${page.slug}:`,
      result.hydrated ? `ok (${result.rootCount} roots → draft v${result.draftVersionId})` : result.reason,
    );
    if (result.hydrated) hydrated += 1;
  }

  console.log(`[hydrate] Done. ${hydrated} page(s) hydrated.`);
  await closeDbPool();
}

main().catch((err) => {
  console.error('[hydrate] Failed:', err?.message || err);
  process.exit(1);
});
