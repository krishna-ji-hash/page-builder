import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { adminActivePathOpts } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import {
  normalizePageSeo,
  normalizeProjectSeo,
  normalizeCmsItemSeo,
} from '@/lib/seo/seoEngine';
import { runSeoAudit } from '@/lib/seo/seoAuditEngine';
import {
  collectInternalLinks,
  countMissingAlt,
  effectivePageSeoFields,
} from '@/lib/seo/seoPageHelpers';
import { getProjectSeo, savePageSeo } from '@/services/builder/seoService';
import { getProjectSitemapPreview, runProjectSeoAudit } from '@/services/seo/seoSuiteService';
import { listSeoRedirects } from '@/services/seo/seoRedirectService';
import { getActiveProject } from '@/services/platform/siteSettingService';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getProjectRow(projectId) {
  const [rows] = await getDbPool().query(
    `SELECT id, slug, name, title, config_json FROM projects WHERE id = ? LIMIT 1`,
    [projectId]
  );
  if (!rows.length) throw new Error('Project not found');
  return rows[0];
}

function pageStatus(row) {
  if (row.published_version_id) return 'published';
  if (row.status === 'archived') return 'archived';
  return 'draft';
}

function indexingLabel(pageSeo, projectSeo) {
  if (!projectSeo.indexingEnabled) return 'project-blocked';
  if (pageSeo.noindex) return 'noindex';
  if (pageSeo.nofollow) return 'nofollow';
  return 'indexable';
}

export async function getSeoDashboardOverview(projectId, origin) {
  const pid = Number(projectId);
  const project = await getProjectRow(pid);
  const projectConfig = parseJson(project.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);
  const audit = await runProjectSeoAudit(pid);
  const sitemap = await getProjectSitemapPreview(pid, origin).catch(() => null);

  const pool = getDbPool();
  const [pageRows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, p.status, p.published_version_id, p.updated_at,
            pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.updated_at DESC`,
    [pid]
  );

  let missingTitle = 0;
  let missingDesc = 0;
  let missingOg = 0;
  let missingCanonical = 0;
  let noindexCount = 0;
  let missingAltTotal = 0;
  let brokenLinks = 0;
  let publishedCount = 0;

  const knownPaths = new Set(
    pageRows.map((r) => publicPagePath(project.slug, r.slug))
  );

  for (const row of pageRows) {
    if (row.published_version_id) publishedCount += 1;
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const effective = effectivePageSeoFields(pageSeo, projectConfig, row.title, row.slug, project.slug);
    const tree = parseJson(row.snapshot_json, {})?.nodes || null;
    if (!effective.title) missingTitle += 1;
    if (!effective.description) missingDesc += 1;
    if (!effective.ogImage) missingOg += 1;
    if (!effective.canonicalUrl && !projectSeo.canonicalDomain) missingCanonical += 1;
    if (effective.noindex) noindexCount += 1;
    if (Array.isArray(tree)) {
      missingAltTotal += countMissingAlt(tree);
      const links = collectInternalLinks(tree);
      for (const href of links) {
        const normalized = href.split('?')[0].split('#')[0];
        if (normalized && !knownPaths.has(normalized) && !normalized.startsWith('http')) {
          brokenLinks += 1;
        }
      }
    }
  }

  const [blogCountRow] = await pool.query(
    `SELECT COUNT(*) AS c FROM cms_items i
     JOIN cms_collections c ON c.id = i.collection_id
     WHERE c.project_id = ? AND c.slug = 'blog'`,
    [pid]
  );

  const robotsStatus =
    !projectSeo.indexingEnabled || projectSeo.robots.index === false ? 'blocked' : 'allowed';

  return {
    projectId: pid,
    projectSlug: project.slug,
    projectName: project.name || project.title,
    overallScore: audit.score,
    publishedPages: publishedCount,
    totalPages: pageRows.length,
    blogPosts: Number(blogCountRow[0]?.c || 0),
    missingTitle,
    missingDescription: missingDesc,
    missingOgImage: missingOg,
    missingCanonical,
    noindexPages: noindexCount,
    schemaCoverage: audit.dashboard?.schemaCoverage ?? 0,
    sitemapStatus: sitemap?.urlCount ? 'ready' : 'empty',
    sitemapUrlCount: sitemap?.urlCount ?? 0,
    sitemapPublicPath: sitemap?.publicPath ?? `/${project.slug}/sitemap.xml`,
    robotsStatus,
    brokenLinksCount: brokenLinks,
    missingAltCount: missingAltTotal,
    auditSummary: audit.summary,
    dashboard: audit.dashboard,
  };
}

export async function listProjectPagesSeo(projectId) {
  const pid = Number(projectId);
  const project = await getProjectRow(pid);
  const active = await getActiveProject();
  const builderPathOpts = adminActivePathOpts(active);
  const projectConfig = parseJson(project.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);

  const [rows] = await getDbPool().query(
    `SELECT p.id, p.title, p.slug, p.seo_json, p.status, p.published_version_id, p.updated_at,
            pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.title ASC`,
    [pid]
  );

  return rows.map((row) => {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const tree = parseJson(row.snapshot_json, {})?.nodes || null;
    const effective = effectivePageSeoFields(pageSeo, projectConfig, row.title, row.slug, project.slug);
    const audit = runSeoAudit({
      pageName: row.title || row.slug,
      pageSeo,
      projectSeo,
      tree: Array.isArray(tree) ? tree : null,
    });
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: pageStatus(row),
      seoTitle: pageSeo.title || effective.title,
      metaDescription: pageSeo.description || effective.description,
      focusKeyword: pageSeo.focusKeyword || '',
      seoScore: audit.score,
      indexingStatus: indexingLabel(pageSeo, projectSeo),
      schemaType: pageSeo.schemaType || '',
      canonicalUrl: pageSeo.canonicalUrl || effective.canonicalUrl,
      ogImage: pageSeo.ogImage || effective.ogImage,
      noindex: pageSeo.noindex === true,
      nofollow: pageSeo.nofollow === true,
      sitemapExclude: pageSeo.sitemapExclude === true,
      updatedAt: row.updated_at,
      seo: pageSeo,
      livePath: publicPagePath(project.slug, row.slug),
      builderPath: adminBuilderPagePath(project.slug, row.slug, builderPathOpts),
    };
  });
}

export async function patchProjectPageSeo(projectId, pageId, seoPatch) {
  const pid = Number(projectId);
  const pgId = Number(pageId);
  const [rows] = await getDbPool().query(
    `SELECT id FROM pages WHERE id = ? AND project_id = ? LIMIT 1`,
    [pgId, pid]
  );
  if (!rows.length) throw new Error('Page not found in project');
  return savePageSeo(pgId, seoPatch);
}

export async function listBlogSeo(projectId) {
  const pid = Number(projectId);
  const project = await getProjectRow(pid);
  const projectConfig = parseJson(project.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);

  const [rows] = await getDbPool().query(
    `SELECT i.id, i.title, i.slug, i.status, i.seo_json, i.data_json, i.published_at, i.updated_at
     FROM cms_items i
     JOIN cms_collections c ON c.id = i.collection_id
     WHERE c.project_id = ? AND c.slug = 'blog'
     ORDER BY i.updated_at DESC`,
    [pid]
  );

  return rows.map((row) => {
    const itemSeo = normalizeCmsItemSeo(parseJson(row.seo_json, {}) || {});
    const data = parseJson(row.data_json, {}) || {};
    const pageSeo = normalizePageSeo({
      title: itemSeo.title || row.title,
      description: itemSeo.description || data.excerpt || '',
      focusKeyword: itemSeo.focusKeyword,
      ogImage: itemSeo.ogImage || data.featuredImage,
      schemaType: itemSeo.schemaType || 'BlogPosting',
      noindex: itemSeo.noindex,
    });
    const audit = runSeoAudit({ pageName: row.title, pageSeo, projectSeo, tree: null });
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      category: data.category || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || '',
      focusKeyword: itemSeo.focusKeyword || '',
      seoTitle: itemSeo.title || row.title,
      metaDescription: itemSeo.description || data.excerpt || '',
      seoScore: audit.score,
      schemaType: itemSeo.schemaType || 'BlogPosting',
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      seo: itemSeo,
      livePath: `/${project.slug}/blog/${row.slug}`,
    };
  });
}

export async function patchBlogItemSeo(projectId, itemId, seoPatch) {
  const pid = Number(projectId);
  const id = Number(itemId);
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT i.id, i.seo_json FROM cms_items i
     JOIN cms_collections c ON c.id = i.collection_id
     WHERE i.id = ? AND c.project_id = ? AND c.slug = 'blog' LIMIT 1`,
    [id, pid]
  );
  if (!rows.length) throw new Error('Blog post not found');
  const prev = parseJson(rows[0].seo_json, {}) || {};
  const next = { ...prev, ...(seoPatch && typeof seoPatch === 'object' ? seoPatch : {}) };
  await pool.query(`UPDATE cms_items SET seo_json = ? WHERE id = ?`, [JSON.stringify(next), id]);
  return next;
}

export async function getSearchConsoleChecklist(projectId, origin) {
  const pid = Number(projectId);
  const project = await getProjectRow(pid);
  const { config, seo } = await getProjectSeo(pid);
  const projectSeo = normalizeProjectSeo(config);
  const overview = await getSeoDashboardOverview(pid, origin);
  const pages = await listProjectPagesSeo(pid);
  const redirects = await listSeoRedirects(pid).catch(() => []);

  const pool = getDbPool();
  const [domainRows] = await pool.query(
    `SELECT domain, verified FROM project_domains WHERE project_id = ?`,
    [pid]
  );
  const verifiedDomain = domainRows.some((d) => Boolean(d.verified));

  const importantNoindex = pages.filter(
    (p) => p.status === 'published' && p.noindex && ['home', 'about-us', 'about', 'contact'].includes(p.slug)
  );

  const items = [
    {
      id: 'domain-verified',
      label: 'Domain verified',
      status: verifiedDomain ? 'pass' : 'warn',
      detail: verifiedDomain ? 'At least one domain is verified.' : 'Add and verify a custom domain.',
    },
    {
      id: 'sitemap-ready',
      label: 'Sitemap ready',
      status: overview.sitemapUrlCount > 0 ? 'pass' : 'warn',
      detail: `${overview.sitemapUrlCount} URLs in sitemap.`,
    },
    {
      id: 'robots-ok',
      label: 'Robots OK',
      status: overview.robotsStatus === 'allowed' ? 'pass' : 'fail',
      detail: overview.robotsStatus === 'allowed' ? 'Indexing enabled.' : 'Indexing blocked.',
    },
    {
      id: 'canonical-domain',
      label: 'Canonical domain set',
      status: projectSeo.canonicalDomain ? 'pass' : 'warn',
      detail: projectSeo.canonicalDomain || 'Set canonical domain in Project Defaults.',
    },
    {
      id: 'pages-index-ready',
      label: 'Published pages indexed-ready',
      status: overview.missingTitle === 0 && overview.missingDescription === 0 ? 'pass' : 'warn',
      detail: `${overview.missingTitle} missing titles, ${overview.missingDescription} missing descriptions.`,
    },
    {
      id: 'no-noindex-important',
      label: 'No noindex on important pages',
      status: importantNoindex.length === 0 ? 'pass' : 'fail',
      detail: importantNoindex.length
        ? `noindex on: ${importantNoindex.map((p) => p.slug).join(', ')}`
        : 'Home and key pages are indexable.',
    },
    {
      id: 'schema-valid',
      label: 'Schema coverage',
      status: overview.schemaCoverage >= 50 ? 'pass' : 'warn',
      detail: `${overview.schemaCoverage}% schema coverage.`,
    },
  ];

  const readyScore = Math.round((items.filter((i) => i.status === 'pass').length / items.length) * 100);

  return {
    projectSlug: project.slug,
    readyScore,
    items,
    redirectsCount: redirects.length,
    futureIntegrations: {
      googleSearchConsole: {
        status: 'planned',
        metrics: ['Impressions', 'Clicks', 'CTR', 'Average position'],
      },
    },
    seo,
  };
}
