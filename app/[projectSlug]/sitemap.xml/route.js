import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { normalizeProjectSeo } from '@/lib/seo/seoEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  if (!isPublicSlug(projectSlug)) return new NextResponse('Not found', { status: 404 });

  const pool = getDbPool();
  const [projRows] = await pool.query(
    `SELECT id, config_json FROM projects WHERE slug = ? LIMIT 1`,
    [projectSlug]
  );
  if (!projRows.length) return new NextResponse('Not found', { status: 404 });

  const projectId = Number(projRows[0].id);
  const projectConfig = parseJsonValue(projRows[0].config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);

  const base = absoluteBaseUrl(request.nextUrl?.origin, projectSeo.canonicalDomain);
  if (!base) return new NextResponse('Not found', { status: 404 });

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
      if (!projectSeo.indexingEnabled || noindex) return null;
      const loc = joinUrl(base, `/${projectSlug}/${r.slug}`);
      return { loc, lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : null };
    })
    .filter(Boolean);

  // CMS: blog + properties (published only)
  const [cmsRows] = await pool.query(
    `
    SELECT c.slug AS collection_slug, i.slug AS item_slug, i.updated_at
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
      return { loc, lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : null };
    })
    .filter(Boolean);

  const all = [...pageUrls, ...cmsUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

