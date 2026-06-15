import { getDbPool } from '@/lib/db';
import { normalizeProjectSeo, normalizePageSeo, resolveSeoMetadata } from '@/lib/seo/seoEngine';
import { runSeoAudit, aggregateProjectSeoAudit } from '@/lib/seo/seoAuditEngine';
import { buildProjectSitemapUrls, renderSitemapXml } from '@/lib/seo/sitemapBuilder';
import { getProjectSeo } from '@/services/builder/seoService';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildTree(nodes) {
  const byId = new Map();
  const roots = [];
  for (const n of nodes || []) {
    byId.set(n.id, { ...n, children: [] });
  }
  for (const n of nodes || []) {
    const node = byId.get(n.id);
    const parentId = n.parent_node_id;
    if (parentId && byId.has(parentId)) byId.get(parentId).children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function runProjectSeoAudit(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const pool = getDbPool();
  const { config } = await getProjectSeo(pid);
  const projectSeo = normalizeProjectSeo(config);

  const [projRows] = await pool.query(`SELECT slug FROM projects WHERE id = ? LIMIT 1`, [pid]);
  if (!projRows.length) throw new Error('Project not found');
  const projectSlug = projRows[0].slug;

  const [pageRows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, p.published_version_id, pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.created_at ASC`,
    [pid]
  );

  const pageAudits = pageRows.map((row) => {
    const pageSeo = normalizePageSeo(parseJsonValue(row.seo_json, {}) || {});
    const snapshot = parseJsonValue(row.snapshot_json, {}) || {};
    const tree = Array.isArray(snapshot.nodes) ? snapshot.nodes : null;
    return runSeoAudit({
      pageName: row.title || row.slug,
      pageSeo,
      projectSeo,
      tree,
    });
  });

  const [blogRows] = await pool.query(
    `
    SELECT i.title, i.slug, i.seo_json, i.data_json
    FROM cms_items i
    JOIN cms_collections c ON c.id = i.collection_id
    WHERE c.project_id = ? AND c.slug = 'blog'
    ORDER BY i.updated_at DESC
    `,
    [pid]
  );

  const blogAudits = blogRows.map((row) => {
    const itemSeo = parseJsonValue(row.seo_json, {}) || {};
    const data = parseJsonValue(row.data_json, {}) || {};
    const pageSeo = normalizePageSeo({
      title: itemSeo.title || row.title,
      description: itemSeo.description || data.excerpt || '',
      focusKeyword: itemSeo.focusKeyword,
      ogImage: itemSeo.ogImage || data.featuredImage,
      canonicalUrl: itemSeo.canonicalUrl,
      schemaType: itemSeo.schemaType || 'BlogPosting',
      noindex: itemSeo.noindex,
    });
    return runSeoAudit({
      pageName: `Blog: ${row.title || row.slug}`,
      pageSeo,
      projectSeo,
      tree: null,
    });
  });

  const allAudits = [...pageAudits, ...blogAudits];
  const aggregate = aggregateProjectSeoAudit(allAudits);

  const schemaCoverage = allAudits.filter((a) => !a.issues.some((i) => i.id === 'missing-schema')).length;
  const missingMetadata = allAudits.filter((a) =>
    a.issues.some((i) => i.id === 'missing-title' || i.id === 'missing-description')
  ).length;

  return {
    projectId: pid,
    projectSlug,
    score: aggregate.score,
    summary: aggregate.summary,
    pages: pageAudits,
    blogs: blogAudits,
    dashboard: {
      overallScore: aggregate.score,
      pagesSeo: pageAudits.length
        ? Math.round(pageAudits.reduce((s, a) => s + a.score, 0) / pageAudits.length)
        : 0,
      blogSeo: blogAudits.length
        ? Math.round(blogAudits.reduce((s, a) => s + a.score, 0) / blogAudits.length)
        : 0,
      schemaCoverage: allAudits.length ? Math.round((schemaCoverage / allAudits.length) * 100) : 0,
      missingMetadata,
      indexingStatus: projectSeo.indexingEnabled ? 'enabled' : 'disabled',
    },
  };
}

export async function getProjectSitemapPreview(projectId, origin) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const pool = getDbPool();
  const [projRows] = await pool.query(`SELECT slug, config_json FROM projects WHERE id = ? LIMIT 1`, [pid]);
  if (!projRows.length) throw new Error('Project not found');

  const projectSlug = projRows[0].slug;
  const projectConfig = parseJsonValue(projRows[0].config_json, {}) || {};
  const { urls } = await buildProjectSitemapUrls({
    pool,
    projectId: pid,
    projectSlug,
    projectConfig,
    origin,
  });

  return {
    projectSlug,
    urlCount: urls.length,
    urls,
    xml: renderSitemapXml(urls),
    publicPath: `/${projectSlug}/sitemap.xml`,
  };
}

export async function resolvePageSeoPreview({ projectConfig, pageName, pageSeo, cmsItemSeo, cmsContext }) {
  const mergedPageSeo = cmsItemSeo ? { ...pageSeo, ...cmsItemSeo } : pageSeo;
  return resolveSeoMetadata({
    projectConfig,
    pageName,
    currentPath: cmsContext?.sys?.slug ? `/${cmsContext.sys.slug}` : '',
    pageSeo: mergedPageSeo,
    cmsContext,
  });
}
