import { publicPagePath } from '../publicSiteUrls.js';
import { normalizeProjectSeo } from './seoEngine.js';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function absoluteBaseUrl(origin, canonicalDomain) {
  const cd = String(canonicalDomain || '').trim().replace(/\/+$/, '');
  if (cd && /^https?:\/\//i.test(cd)) return cd;
  const o = String(origin || '').replace(/\/+$/, '');
  return o || '';
}

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? String(path) : `/${path}`;
  return `${b}${p}`;
}

function safeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build sitemap URL entries for a project (pages + CMS collections).
 */
export async function buildProjectSitemapUrls({ pool, projectId, projectSlug, projectConfig, origin }) {
  const projectSeo = normalizeProjectSeo(projectConfig);
  const base = absoluteBaseUrl(origin, projectSeo.canonicalDomain);
  if (!base) return { base: '', urls: [] };

  const [pageRows] = await pool.query(
    `SELECT slug, seo_json, updated_at
     FROM pages
     WHERE project_id = ? AND status = 'published' AND published_version_id IS NOT NULL
     ORDER BY updated_at DESC, id DESC`,
    [projectId]
  );

  const pageUrls = pageRows
    .map((r) => {
      const seo = parseJsonValue(r.seo_json, {}) || {};
      const noindex = seo?.noindex === true;
      const sitemapExclude = seo?.sitemapExclude === true;
      if (!projectSeo.indexingEnabled || noindex || sitemapExclude) return null;
      const loc = joinUrl(base, publicPagePath(projectSlug, r.slug));
      return { loc, lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : null, kind: 'page' };
    })
    .filter(Boolean);

  const [cmsRows] = await pool.query(
    `
    SELECT c.slug AS collection_slug, i.slug AS item_slug, i.seo_json, i.updated_at
    FROM cms_items i
    JOIN cms_collections c ON c.id = i.collection_id
    WHERE c.project_id = ?
      AND c.slug IN ('blog', 'properties', 'products')
      AND i.status = 'published'
    ORDER BY i.updated_at DESC, i.id DESC
    `,
    [projectId]
  );

  const cmsUrls = cmsRows
    .map((r) => {
      const seo = parseJsonValue(r.seo_json, {}) || {};
      if (seo?.noindex === true) return null;
      const route =
        r.collection_slug === 'blog'
          ? 'blog'
          : r.collection_slug === 'properties'
            ? 'property'
            : r.collection_slug === 'products'
              ? 'product'
              : '';
      if (!route) return null;
      const loc = joinUrl(base, `/${projectSlug}/${route}/${r.item_slug}`);
      return {
        loc,
        lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : null,
        kind: r.collection_slug,
      };
    })
    .filter(Boolean);

  const blogIndexLoc = joinUrl(base, `/${projectSlug}/blog`);
  const urls = [
    ...pageUrls,
    { loc: blogIndexLoc, lastmod: null, kind: 'blog-index' },
    ...cmsUrls,
  ];

  return { base, urls };
}

export function renderSitemapXml(urls) {
  const all = Array.isArray(urls) ? urls : [];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${safeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${safeXml(u.lastmod)}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`;
}
