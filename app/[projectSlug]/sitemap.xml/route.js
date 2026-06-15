import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { buildProjectSitemapUrls, renderSitemapXml } from '@/lib/seo/sitemapBuilder';

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
  const { base, urls } = await buildProjectSitemapUrls({
    pool,
    projectId,
    projectSlug,
    projectConfig,
    origin: request.nextUrl?.origin,
  });
  if (!base) return new NextResponse('Not found', { status: 404 });

  const xml = renderSitemapXml(urls);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
