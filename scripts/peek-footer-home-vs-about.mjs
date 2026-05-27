/**
 * Compare footer / global merge flags on dispatch home vs about-us published snapshots.
 * node --env-file=.env scripts/peek-footer-home-vs-about.mjs
 */
import { getDbPool } from '../lib/db.js';

const PROJECT_SLUG = process.env.PEEK_PROJECT || 'dispatch';

function walkRoots(nodes) {
  return (Array.isArray(nodes) ? nodes : []).map((n) => ({
    id: n.id,
    name: n.displayName || n.display_name,
    type: n.nodeType || n.node_type,
    isFooter: n.props?.meta?.isFooter === true || n.meta?.isFooter === true,
    isHeader: n.props?.meta?.isHeader === true || n.meta?.isHeader === true,
    sectionTemplate: n.props?.meta?.sectionTemplate || null,
    position: n.style_json?.layout?.position || n.props?.style_json?.layout?.position,
  }));
}

async function loadPage(pool, pageSlug) {
  const [rows] = await pool.query(
    `SELECT p.id, p.slug, pv.snapshot_json
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE pr.slug = ? AND p.slug = ?
     LIMIT 1`,
    [PROJECT_SLUG, pageSlug]
  );
  if (!rows.length) return null;
  const raw = rows[0].snapshot_json;
  const snap = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const nodes = snap?.nodes || [];
  const globals = snap?.globalSections || snap?.global_sections || {};
  const [projRows] = await pool.query(
    `SELECT config_json FROM projects pr
     JOIN pages p ON p.project_id = pr.id
     WHERE pr.slug = ? AND p.slug = ? LIMIT 1`,
    [PROJECT_SLUG, pageSlug]
  );
  const cfg = projRows[0]?.config_json;
  const projectConfig = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
  const cfgGlobals = projectConfig?.globalSections || {};

  return {
    pageId: rows[0].id,
    slug: rows[0].slug,
    roots: walkRoots(nodes),
    hasOwnFooter: nodes.some((n) => n.props?.meta?.isFooter || n.meta?.isFooter),
    hasOwnHeader: nodes.some((n) => n.props?.meta?.isHeader || n.meta?.isHeader),
    globalFooterInSnapshot: Boolean(globals?.footer),
    globalHeaderInSnapshot: Boolean(globals?.header),
    globalFooterInProject: Boolean(cfgGlobals?.footer),
    globalHeaderInProject: Boolean(cfgGlobals?.header),
    rootCount: nodes.length,
  };
}

const pool = getDbPool();
try {
  for (const slug of ['home', 'about-us', 'about']) {
    const data = await loadPage(pool, slug);
    if (!data) {
      console.log(`\n--- ${slug}: NOT FOUND ---`);
      continue;
    }
    console.log(`\n--- ${slug} (page ${data.pageId}) ---`);
    console.log('roots:', data.rootCount);
    console.log(
      'snapshot globals: footer=',
      data.globalFooterInSnapshot,
      'header=',
      data.globalHeaderInSnapshot
    );
    console.log(
      'project config globals: footer=',
      data.globalFooterInProject,
      'header=',
      data.globalHeaderInProject
    );
    console.log('pageDeclaresOwnFooter:', data.hasOwnFooter, 'pageDeclaresOwnHeader:', data.hasOwnHeader);
    data.roots.forEach((r, i) => {
      console.log(
        `  [${i}] id=${r.id} ${r.name} template=${r.sectionTemplate || '-'} footer=${r.isFooter} header=${r.isHeader} pos=${r.position || '-'}`
      );
    });
  }
} finally {
  await pool.end();
}
