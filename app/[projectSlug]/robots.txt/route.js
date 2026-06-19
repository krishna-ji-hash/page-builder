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

  const projectConfig = parseJsonValue(projRows[0].config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);

  const base = absoluteBaseUrl(request.nextUrl?.origin, projectSeo.canonicalDomain);
  const sitemapUrl = base ? joinUrl(base, `/${projectSlug}/sitemap.xml`) : '';

  const allowIndexing = projectSeo.indexingEnabled && projectSeo.robots.index !== false;
  const robotsMode = projectSeo.robotsMode || 'allow_all';
  const customDisallow = Array.isArray(projectSeo.robotsDisallowPaths) ? projectSeo.robotsDisallowPaths : [];
  const crawlDelay = Number(projectSeo.crawlDelay) > 0 ? Number(projectSeo.crawlDelay) : null;

  const lines = [];
  lines.push('User-agent: *');
  if (!allowIndexing || robotsMode === 'disallow_all') {
    lines.push('Disallow: /');
  } else if (robotsMode === 'custom' && customDisallow.length) {
    lines.push('Allow: /');
    for (const rule of customDisallow) {
      const p = String(rule || '').trim();
      if (p) lines.push(`Disallow: ${p.startsWith('/') ? p : `/${p}`}`);
    }
  } else {
    lines.push('Allow: /');
  }
  if (crawlDelay) lines.push(`Crawl-delay: ${crawlDelay}`);
  if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  lines.push('');

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

