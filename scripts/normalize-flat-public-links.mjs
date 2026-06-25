/**
 * Strip legacy /{projectSlug}/ prefixes from stored nav hrefs (flat public URLs).
 * Usage: node --env-file=.env scripts/normalize-flat-public-links.mjs [projectSlug]
 */
import { getDbPool } from '../lib/db.js';

const projectSlug = String(process.argv[2] || 'd').trim();

function stripProjectPrefix(value, slug) {
  if (typeof value !== 'string') return value;
  const prefix = `/${slug}/`;
  if (value.startsWith(prefix)) {
    const rest = value.slice(prefix.length);
    return rest ? `/${rest}` : '/home';
  }
  if (value === `/${slug}`) return '/home';
  return value;
}

function walkJson(value, slug) {
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        const u = new URL(value);
        const path = u.pathname;
        const prefix = `/${slug}/`;
        if (path.startsWith(prefix)) {
          const rest = path.slice(prefix.length);
          return rest ? `/${rest}` : '/home';
        }
        return value;
      } catch {
        return value;
      }
    }
    return stripProjectPrefix(value, slug);
  }
  if (Array.isArray(value)) return value.map((item) => walkJson(item, slug));
  if (!value || typeof value !== 'object') return value;

  const next = { ...value };
  for (const key of ['href', 'to', 'url']) {
    if (typeof next[key] === 'string') next[key] = walkJson(next[key], slug);
  }
  if (next.mega && typeof next.mega === 'object') next.mega = walkJson(next.mega, slug);
  if (next.featured && typeof next.featured === 'object') next.featured = walkJson(next.featured, slug);
  if (Array.isArray(next.items)) next.items = walkJson(next.items, slug);
  if (Array.isArray(next.children)) next.children = walkJson(next.children, slug);
  return next;
}

const pool = getDbPool();
const [projects] = await pool.query(`SELECT id, slug FROM projects WHERE slug = ? LIMIT 1`, [projectSlug]);
const project = projects[0];
if (!project) {
  console.error(`Project not found: ${projectSlug}`);
  process.exit(1);
}

const [nodes] = await pool.query(
  `SELECT bn.id, bn.props_json
   FROM builder_nodes bn
   INNER JOIN pages p ON p.id = bn.page_id
   WHERE p.project_id = ?`,
  [project.id]
);

let updated = 0;
for (const row of nodes) {
  let props = row.props_json;
  if (typeof props === 'string') {
    try {
      props = JSON.parse(props);
    } catch {
      continue;
    }
  }
  if (!props || typeof props !== 'object') continue;
  const next = walkJson(props, projectSlug);
  const before = JSON.stringify(props);
  const after = JSON.stringify(next);
  if (before === after) continue;
  await pool.query(`UPDATE builder_nodes SET props_json = ? WHERE id = ?`, [JSON.stringify(next), row.id]);
  updated += 1;
}

console.log(`Normalized ${updated} builder_nodes for project "${projectSlug}" (id ${project.id})`);
process.exit(0);
