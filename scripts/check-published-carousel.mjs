import { getDbPool } from '../lib/db.js';
import { parsePublishedSnapshot } from '../lib/publishedSnapshot.js';

const pool = getDbPool();
const [rows] = await pool.query(
  `SELECT p.published_version_id, p.draft_version_id, pv.snapshot_json
   FROM pages p
   JOIN page_versions pv ON pv.id = p.published_version_id
   JOIN projects pr ON pr.id = p.project_id
   WHERE pr.slug = 't' AND p.slug = 'home' LIMIT 1`
);
console.log('published vid', rows[0].published_version_id, 'draft', rows[0].draft_version_id);
const parsed = parsePublishedSnapshot(rows[0].snapshot_json);
let carousels = 0;
function walk(n) {
  if (n.nodeType === 'carousel') carousels += 1;
  (n.children || []).forEach(walk);
}
parsed.nodes.forEach(walk);
console.log('carousel count in published', carousels);

const [draftRows] = await pool.query(
  `SELECT snapshot_json FROM page_versions WHERE id = ?`,
  [rows[0].draft_version_id]
);
const draft = parsePublishedSnapshot(draftRows[0].snapshot_json);
let dc = 0;
draft.nodes.forEach((n) => walk(n));
console.log('carousel count after walk draft', dc);
function countC(nodes) {
  let c = 0;
  function w(n) {
    if (n.nodeType === 'carousel') c += 1;
    (n.children || []).forEach(w);
  }
  nodes.forEach(w);
  return c;
}
console.log('draft carousels', countC(draft.nodes));
await pool.end();
