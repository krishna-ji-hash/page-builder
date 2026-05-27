/**
 * Repair dispatch/home: remove mixed Hero Landing, insert reusable hero + fix Get in Touch.
 *
 * Usage: npm run dev (in another terminal), then:
 *   node --env-file=.env scripts/repair-dispatch-home-sections.mjs
 */
import { getDbPool } from '../lib/db.js';
import { buildReusableBulkOrderedNodes } from '../lib/reusableBlockInsert.js';

const BASE = process.env.REPAIR_BASE_URL || 'http://localhost:3000';
const PROJECT_SLUG = process.env.REPAIR_PROJECT_SLUG || 'dispatch';
const PAGE_SLUG = process.env.REPAIR_PAGE_SLUG || 'home';

function parseJson(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function rowHeadingText(row) {
  const texts = [];
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n?.nodeType === 'heading' && n?.props?.text) texts.push(String(n.props.text));
      walk(n.children);
    }
  };
  walk(row?.children || []);
  return texts.join(' ');
}

async function fetchJson(url, options) {
  const res = await fetch(url, { cache: 'no-store', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.details ? ` (${data.details})` : '';
    throw new Error(`${data.error || res.statusText}${detail}`);
  }
  return data;
}

async function fetchBuilderTree(pageId) {
  const data = await fetchJson(`${BASE}/api/pages/${pageId}/builder`);
  return data.tree || [];
}

async function unlockSectionRow(row) {
  if (!row?.id || row.nodeType !== 'row') return;
  const meta = row.props?.meta || {};
  if (!meta.sectionLocked) return;
  await fetchJson(`${BASE}/api/nodes/${row.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      props: { ...row.props, meta: { ...meta, sectionLocked: false } },
    }),
  });
}

async function deleteNode(nodeId) {
  return fetchJson(`${BASE}/api/nodes/${nodeId}`, { method: 'DELETE' });
}

async function bulkCreate(pageId, nodes) {
  return fetchJson(`${BASE}/api/pages/${pageId}/nodes/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes }),
  });
}

async function loadReusableBlock(pool, projectId, nameMatch) {
  const [rows] = await pool.query(
    `SELECT id, name, snapshot_json FROM reusable_blocks
     WHERE project_id = ? AND LOWER(name) LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [projectId, `%${nameMatch.toLowerCase()}%`]
  );
  if (!rows.length) return null;
  const snap = parseJson(rows[0].snapshot_json);
  return {
    id: rows[0].id,
    name: rows[0].name,
    nodes: Array.isArray(snap?.nodes) ? snap.nodes : [],
  };
}

async function main() {
  const pool = getDbPool();
  const [pageRows] = await pool.query(
    `SELECT p.id, p.project_id FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     WHERE pr.slug = ? AND p.slug = ? LIMIT 1`,
    [PROJECT_SLUG, PAGE_SLUG]
  );
  if (!pageRows.length) {
    console.error('Page not found:', PROJECT_SLUG, PAGE_SLUG);
    process.exit(1);
  }
  const pageId = pageRows[0].id;
  const projectId = pageRows[0].project_id;

  const heroBlock = await loadReusableBlock(pool, projectId, 'hero section');
  const touchBlock = await loadReusableBlock(pool, projectId, 'get in touch');
  if (!heroBlock?.nodes?.length || !touchBlock?.nodes?.length) {
    console.error('Missing reusable blocks (hero section / get in touch)');
    process.exit(1);
  }

  let tree = await fetchBuilderTree(pageId);

  const heroLandingRows = tree.filter(
    (r) =>
      r?.nodeType === 'row' &&
      (/hero landing/i.test(String(r.displayName || '')) ||
        /powering businesses/i.test(rowHeadingText(r)))
  );
  for (const row of heroLandingRows) {
    console.log('Deleting mixed hero row:', row.id, row.displayName);
    await unlockSectionRow(row);
    const res = await deleteNode(row.id);
    tree = res.tree || tree;
  }

  const touchRows = tree.filter(
    (r) => r?.nodeType === 'row' && /get in touch/i.test(String(r.displayName || ''))
  );
  if (touchRows.length > 1) {
    for (const row of touchRows.slice(0, -1)) {
      console.log('Deleting duplicate Get in Touch:', row.id);
      await unlockSectionRow(row);
      const res = await deleteNode(row.id);
      tree = res.tree || tree;
    }
  }

  const headerIdx = tree.findIndex(
    (r) =>
      r?.nodeType === 'row' &&
      (r?.props?.meta?.isHeader || /header/i.test(String(r.displayName || '')))
  );
  const heroInsertIndex = headerIdx >= 0 ? headerIdx + 1 : 0;
  const hasCleanHero = tree.some((r) => /b2b\s*&\s*b2c shipping/i.test(rowHeadingText(r)));
  if (!hasCleanHero) {
    console.log('Inserting reusable hero at index', heroInsertIndex);
    const { ordered } = buildReusableBulkOrderedNodes(heroBlock.id, heroBlock.nodes, heroInsertIndex);
    const res = await bulkCreate(pageId, ordered);
    tree = res.tree || tree;
  } else {
    console.log('B2B hero already present');
  }

  tree = await fetchBuilderTree(pageId);
  const touchIdx = tree.findIndex(
    (r) => r?.nodeType === 'row' && /get in touch/i.test(String(r.displayName || ''))
  );
  const touchRow = touchIdx >= 0 ? tree[touchIdx] : null;
  const touchOk =
    touchRow && /get in touch with our team/i.test(rowHeadingText(touchRow));

  if (!touchOk) {
    if (touchRow?.id) {
      console.log('Replacing Get in Touch row:', touchRow.id);
      await unlockSectionRow(touchRow);
      const del = await deleteNode(touchRow.id);
      tree = del.tree || tree;
    }
    const insertAt = touchIdx >= 0 ? touchIdx : tree.length;
    console.log('Inserting reusable Get in Touch at index', insertAt);
    const { ordered } = buildReusableBulkOrderedNodes(touchBlock.id, touchBlock.nodes, insertAt);
    await bulkCreate(pageId, ordered);
  } else {
    console.log('Get in Touch section OK');
  }

  console.log('Repair complete. Open /admin/builder/dispatch/home → Save → Publish for live site.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
