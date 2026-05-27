/**
 * Manual verification helper for draft vs published separation.
 * Run: node --env-file=.env scripts/verify-draft-live-separation.mjs
 * Requires: npm run dev (or next start) on BASE_URL (default http://localhost:3000)
 */
import { getDbPool } from '../lib/db.js';

const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:3000';
const PROJECT_SLUG = process.env.VERIFY_PROJECT_SLUG || 'dispatch';
const PAGE_SLUG = process.env.VERIFY_PAGE_SLUG || 'about-us';

function findFirstHeadingText(nodes) {
  if (!Array.isArray(nodes)) return null;
  for (const n of nodes) {
    if (n?.nodeType === 'heading') {
      const t = n?.props?.text ?? n?.props?.content;
      if (t != null && String(t).trim()) return String(t).trim();
    }
    const child = findFirstHeadingText(n?.children);
    if (child) return child;
  }
  return null;
}

async function getPageRow(pool) {
  const [rows] = await pool.query(
    `SELECT p.id, p.published_version_id, pr.slug AS project_slug, p.slug AS page_slug
     FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     WHERE pr.slug = ? AND p.slug = ?
     LIMIT 1`,
    [PROJECT_SLUG, PAGE_SLUG]
  );
  return rows[0] || null;
}

async function getPublishedHeading(pool, publishedVersionId) {
  const [rows] = await pool.query(
    `SELECT snapshot_json, status FROM page_versions WHERE id = ? LIMIT 1`,
    [publishedVersionId]
  );
  if (!rows.length) return { text: null, status: null };
  let snap = rows[0].snapshot_json;
  if (typeof snap === 'string') snap = JSON.parse(snap);
  return { text: findFirstHeadingText(snap?.nodes), status: rows[0].status };
}

async function getDraftVersionId(pool, pageId) {
  const [rows] = await pool.query(
    `SELECT id FROM page_versions WHERE page_id = ? AND status = 'draft' ORDER BY version_number DESC LIMIT 1`,
    [pageId]
  );
  return rows[0]?.id ?? null;
}

async function fetchLiveHeadingText() {
  const url = `${BASE}/${PROJECT_SLUG}/${PAGE_SLUG}`;
  const res = await fetch(url, { cache: 'no-store' });
  const html = await res.text();
  const m = html.match(/<h[1-6][^>]*>([^<]+)</i);
  return m ? m[1].trim() : null;
}

async function fetchBuilderTree(pageId) {
  const res = await fetch(`${BASE}/api/pages/${pageId}/builder`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'builder fetch failed');
  return data.tree;
}

function setFirstHeadingText(nodes, text) {
  const walk = (arr) => {
    for (const n of arr || []) {
      if (n?.nodeType === 'heading') {
        n.props = { ...(n.props || {}), text };
        return true;
      }
      if (walk(n.children)) return true;
    }
    return false;
  };
  walk(nodes);
  return nodes;
}

async function saveDraft(pageId, tree) {
  const res = await fetch(`${BASE}/api/nodes/update-bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId, nodes: tree }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'save draft failed');
}

async function publish(pageId) {
  const res = await fetch(`${BASE}/api/pages/${pageId}/publish`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'publish failed');
  return data;
}

async function main() {
  const pool = getDbPool();
  const page = await getPageRow(pool);
  if (!page) {
    console.error('Page not found:', PROJECT_SLUG, PAGE_SLUG);
    process.exit(1);
  }
  if (!page.published_version_id) {
    console.error('Page has no published_version_id — publish once from builder first.');
    process.exit(1);
  }

  const pageId = page.id;
  const marker = `SEP_TEST_${Date.now()}`;
  const pubVidBefore = page.published_version_id;

  console.log('Page', pageId, 'published_version_id', pubVidBefore);

  const pubBefore = await getPublishedHeading(pool, pubVidBefore);
  console.log('Published snapshot heading (before):', pubBefore.text);
  console.log('Published version status:', pubBefore.status);

  const tree = await fetchBuilderTree(pageId);
  const originalHeading = findFirstHeadingText(tree);
  console.log('Draft builder heading (before edit):', originalHeading);

  setFirstHeadingText(tree, marker);
  await saveDraft(pageId, tree);
  console.log('Saved draft with marker:', marker);

  const pubAfterSave = await getPublishedHeading(pool, pubVidBefore);
  const draftVid = await getDraftVersionId(pool, pageId);
  console.log('Draft version id:', draftVid, '| Published version id:', pubVidBefore);

  if (Number(draftVid) === Number(pubVidBefore)) {
    console.warn('WARN: draft and published share same version id — separation may be broken.');
  }

  if (pubAfterSave.text === marker) {
    console.error('FAIL step 2-3: published snapshot changed after Save Draft only.');
    process.exit(1);
  }
  console.log('OK steps 2-3: published snapshot unchanged after Save Draft:', pubAfterSave.text);

  let liveAfterSave;
  try {
    liveAfterSave = await fetchLiveHeadingText();
  } catch (e) {
    console.warn('Could not fetch live HTML (is dev server running?):', e.message);
    liveAfterSave = null;
  }
  if (liveAfterSave != null && liveAfterSave === marker) {
    console.error('FAIL step 3: live HTML shows draft marker before publish.');
    process.exit(1);
  }
  if (liveAfterSave != null) {
    console.log('OK step 3: live HTML does not show draft marker:', liveAfterSave);
  }

  const pubResult = await publish(pageId);
  const newPubVid = pubResult.publishedVersionId;
  console.log('Published. New published_version_id:', newPubVid);

  const [pageRow2] = await pool.query(`SELECT published_version_id FROM pages WHERE id = ?`, [pageId]);
  const currentPubVid = pageRow2[0].published_version_id;

  const pubAfterPublish = await getPublishedHeading(pool, currentPubVid);
  if (pubAfterPublish.text !== marker) {
    console.error('FAIL step 4-5: published snapshot missing marker after publish. Got:', pubAfterPublish.text);
    process.exit(1);
  }
  console.log('OK steps 4-5: published snapshot has new content:', pubAfterPublish.text);

  if (Number(currentPubVid) === Number(draftVid)) {
    console.error('FAIL: published_version_id still equals draft version id after publish.');
    process.exit(1);
  }

  await pool.query(
    `UPDATE builder_nodes
     SET props_json = JSON_SET(COALESCE(props_json, '{}'), '$.text', ?)
     WHERE version_id = ? AND node_type = 'heading'
     LIMIT 1`,
    [`MANUAL_DB_${marker}`, draftVid]
  );
  console.log('Manually changed draft builder_nodes heading.');

  const pubAfterDb = await getPublishedHeading(pool, currentPubVid);
  if (pubAfterDb.text !== marker) {
    console.error('FAIL step 6-7: published snapshot changed after draft-only DB edit.');
    process.exit(1);
  }
  console.log('OK steps 6-7: published snapshot unchanged after draft DB edit:', pubAfterDb.text);

  console.log(
    'Step 8: live reads page_versions.snapshot_json for published_version_id',
    currentPubVid,
    '— editing that row in DB will change live (by design).'
  );

  console.log('\nAll separation checks passed (steps 1–7). Re-publish from builder if you want to undo test marker on live.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
