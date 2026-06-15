/**
 * Compare page-owned vs global header nav links.
 * node --env-file=.env scripts/peek-header-nav.mjs
 */
import { getDbPool } from '../lib/db.js';

const PROJECT_SLUG = process.env.PEEK_PROJECT || 'd';

function walkMenu(items, depth = 0) {
  for (const it of items || []) {
    const to = it?.to ?? it?.href ?? '';
    console.log(`${'  '.repeat(depth)}${it?.label || '?'} -> ${to || '(empty)'}`);
    walkMenu(it.children, depth + 1);
  }
}

function findNavNodes(nodes, out = []) {
  for (const n of nodes || []) {
    const type = n.nodeType || n.node_type;
    if (type === 'menu') out.push({ kind: 'menu', node: n });
    if (type === 'button') {
      const name = n.displayName || n.display_name || '';
      const href = n.props?.href;
      if (href !== undefined && href !== '' || /link|nav|feature|service/i.test(name)) {
        out.push({ kind: 'button', name, href: href ?? '(missing)' });
      }
    }
    findNavNodes(n.children, out);
  }
  return out;
}

async function peek(pool, slug) {
  const [rows] = await pool.query(
    `SELECT p.slug, pv.snapshot_json, pr.config_json
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE pr.slug = ? AND p.slug = ?
     LIMIT 1`,
    [PROJECT_SLUG, slug]
  );
  if (!rows.length) {
    console.log(`\n=== ${slug}: NOT FOUND ===`);
    return;
  }
  const snap =
    typeof rows[0].snapshot_json === 'string' ? JSON.parse(rows[0].snapshot_json) : rows[0].snapshot_json;
  const cfg = typeof rows[0].config_json === 'string' ? JSON.parse(rows[0].config_json) : rows[0].config_json;
  const nodes = snap?.nodes || [];
  const hasOwnHeader = nodes.some((n) => n.props?.meta?.isHeader || n.meta?.isHeader);
  const frozenHeader = snap?.globalSections?.header;
  const configHeader = cfg?.globalSections?.header;

  console.log(`\n=== ${slug} ===`);
  console.log('pageDeclaresOwnHeader:', hasOwnHeader);
  console.log('frozen global header in snapshot:', Boolean(frozenHeader));
  console.log('config global header:', Boolean(configHeader));

  const pageHeader = nodes.find((n) => n.props?.meta?.isHeader || n.meta?.isHeader);
  if (pageHeader) {
    console.log('\nPAGE header nav:');
    for (const x of findNavNodes([pageHeader])) {
      if (x.kind === 'button') console.log(`  [button] ${x.name} -> ${x.href}`);
      else {
        console.log('  [menu]');
        walkMenu(x.node.props?.items || []);
      }
    }
  }

  const globalHeader = hasOwnHeader ? null : frozenHeader || configHeader;
  if (globalHeader) {
    console.log('\nGLOBAL header nav (what live uses):');
    for (const x of findNavNodes([globalHeader])) {
      if (x.kind === 'button') console.log(`  [button] ${x.name} -> ${x.href}`);
      else {
        console.log('  [menu]');
        walkMenu(x.node.props?.items || []);
      }
    }
  }
}

const pool = getDbPool();
try {
  for (const slug of ['home', 'domestic-shipping', 'bulk-shipping']) {
    await peek(pool, slug);
  }
} finally {
  await pool.end();
}
