/**
 * Repair mojibake in builder node props + republish affected pages.
 *
 * Usage:
 *   node --env-file=.env scripts/repair-text-encoding.mjs
 *   node --env-file=.env scripts/repair-text-encoding.mjs --slug home
 *   node --env-file=.env scripts/repair-text-encoding.mjs --project dispatch --publish
 */
import { getDbPool, closeDbPool } from '../lib/db.js';
import { repairMojibakeDeep, MOJIBAKE_MARKERS } from '../lib/textEncodingRepair.js';

const BASE = process.env.REPAIR_BASE_URL || 'http://localhost:3000';

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function jsonChanged(before, after) {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function parseArgs(argv) {
  const opts = { project: null, slug: null, publish: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--publish') opts.publish = true;
    else if (arg === '--project') opts.project = argv[++i] || null;
    else if (arg === '--slug') opts.slug = argv[++i] || null;
  }
  return opts;
}

async function loadTargetPages(pool, { project, slug }) {
  const clauses = [];
  const params = [];
  if (project) {
    clauses.push('pr.slug = ?');
    params.push(project);
  }
  if (slug) {
    clauses.push('p.slug = ?');
    params.push(slug);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT p.id, p.slug, pr.slug AS project_slug
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     ${where}
     ORDER BY pr.slug, p.slug`,
    params,
  );
  return rows;
}

function repairSnapshotTree(nodes) {
  if (!Array.isArray(nodes)) return { nodes, changed: false };
  let changed = false;
  const next = nodes.map((node) => {
    const copy = { ...node };
    for (const [key, value] of Object.entries(copy)) {
      if (key === 'children') continue;
      const repaired = repairMojibakeDeep(value);
      if (jsonChanged(value, repaired)) {
        copy[key] = repaired;
        changed = true;
      }
    }
    if (Array.isArray(copy.children) && copy.children.length) {
      const childResult = repairSnapshotTree(copy.children);
      if (childResult.changed) changed = true;
      copy.children = childResult.nodes;
    }
    return copy;
  });
  return { nodes: next, changed };
}

async function repairPageSnapshots(connection, pageId) {
  const [versions] = await connection.query(
    `SELECT id, snapshot_json
     FROM page_versions
     WHERE page_id = ? AND snapshot_json IS NOT NULL`,
    [pageId],
  );

  let updated = 0;
  for (const version of versions) {
    const snapshot = parseJson(version.snapshot_json);
    const nodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
    const { nodes: repairedNodes, changed } = repairSnapshotTree(nodes);
    if (!changed) continue;

    const nextSnapshot = { ...snapshot, nodes: repairedNodes };
    await connection.query(
      `UPDATE page_versions SET snapshot_json = ? WHERE id = ?`,
      [JSON.stringify(nextSnapshot), version.id],
    );
    updated += 1;
  }

  const [pageRows] = await connection.query(
    `SELECT published_json, published_version_id FROM pages WHERE id = ? LIMIT 1`,
    [pageId],
  );
  const pageRow = pageRows[0];
  if (pageRow?.published_version_id) {
    const [pubRows] = await connection.query(
      `SELECT snapshot_json FROM page_versions WHERE id = ? LIMIT 1`,
      [pageRow.published_version_id],
    );
    const publishedJson = pubRows[0]?.snapshot_json;
    if (publishedJson) {
      await connection.query(
        `UPDATE pages SET published_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [typeof publishedJson === 'string' ? publishedJson : JSON.stringify(publishedJson), pageId],
      );
    }
  }

  return updated;
}

async function repairPageNodes(connection, pageId) {
  const [nodes] = await connection.query(
    `SELECT bn.id, bn.props_json, bn.data_json, bn.actions_json
     FROM builder_nodes bn
     JOIN page_versions pv ON pv.id = bn.version_id
     WHERE bn.page_id = ? AND pv.status = 'draft'
     ORDER BY pv.id DESC`,
    [pageId],
  );

  let updated = 0;
  for (const node of nodes) {
    const props = parseJson(node.props_json) || {};
    const dataJson = parseJson(node.data_json);
    const actionsJson = parseJson(node.actions_json);

    const nextProps = repairMojibakeDeep(props);
    const nextData = dataJson ? repairMojibakeDeep(dataJson) : dataJson;
    const nextActions = actionsJson ? repairMojibakeDeep(actionsJson) : actionsJson;

    const changed =
      jsonChanged(props, nextProps) ||
      (dataJson && jsonChanged(dataJson, nextData)) ||
      (actionsJson && jsonChanged(actionsJson, nextActions));

    if (!changed) continue;

    await connection.query(
      `UPDATE builder_nodes
       SET props_json = ?, data_json = ?, actions_json = ?
       WHERE id = ?`,
      [
        JSON.stringify(nextProps),
        nextData ? JSON.stringify(nextData) : null,
        nextActions ? JSON.stringify(nextActions) : null,
        node.id,
      ],
    );
    updated += 1;
  }

  return updated;
}

async function publishPageViaApi(pageId) {
  const res = await fetch(`${BASE}/api/pages/${pageId}/publish`, {
    method: 'POST',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Publish failed (${res.status})`);
  }
  return data;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pool = getDbPool();
  const pages = await loadTargetPages(pool, opts);

  if (!pages.length) {
    console.log('No pages matched the repair filter.');
    await closeDbPool();
    return;
  }

  let totalNodes = 0;
  let totalSnapshots = 0;
  const published = [];

  for (const page of pages) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const updatedNodes = await repairPageNodes(connection, page.id);
      const updatedSnapshots = await repairPageSnapshots(connection, page.id);
      await connection.commit();
      totalNodes += updatedNodes;
      totalSnapshots += updatedSnapshots;
      console.log(
        `[repair] ${page.project_slug}/${page.slug}: updated ${updatedNodes} draft node(s), ${updatedSnapshots} snapshot(s)`,
      );

      if (opts.publish && updatedNodes > 0) {
        const result = await publishPageViaApi(page.id);
        if (result?.publishedVersionId) {
          published.push(`${page.project_slug}/${page.slug} → v${result.versionNumber}`);
        }
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  if (opts.publish && published.length) {
    console.log('[repair] Republished:', published.join(', '));
  } else if (opts.publish) {
    console.log('[repair] Nothing to republish (no node updates).');
  } else {
    console.log('[repair] Done. Re-run with --publish to refresh live snapshots.');
  }

  console.log(`[repair] Total nodes updated: ${totalNodes}, snapshots updated: ${totalSnapshots}`);
  await closeDbPool();
}

main().catch((error) => {
  console.error('[repair] Failed:', error?.message || error);
  process.exit(1);
});
