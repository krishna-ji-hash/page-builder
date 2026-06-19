import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { normalizeRedirectPath } from '@/lib/seo/seoPageHelpers';
import { resolveSeoRedirect } from '@/services/seo/seoRedirectService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getPublicProjectSlug() {
  return String(process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG || process.env.PUBLIC_PROJECT_SLUG || 'dispatch')
    .trim()
    .replace(/^\/+|\/+$/g, '') || 'dispatch';
}

async function resolveProjectId(host, pathname) {
  const pool = getDbPool();
  const h = String(host || '').trim().toLowerCase().split(':')[0];
  if (h && h !== 'localhost' && h !== '127.0.0.1') {
    const [rows] = await pool.query(
      `SELECT pr.id FROM project_domains pd
       JOIN projects pr ON pr.id = pd.project_id
       WHERE pd.domain = ? AND pd.verified_at IS NOT NULL LIMIT 1`,
      [h]
    );
    if (rows.length) return rows[0].id;
    const [hostRows] = await pool.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [h.split('.')[0]]);
    if (hostRows.length) return hostRows[0].id;
  }

  const segments = String(pathname || '').split('/').filter(Boolean);
  if (segments.length >= 2) {
    const [rows] = await pool.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [segments[0]]);
    if (rows.length) return rows[0].id;
  }

  const flatSlug = getPublicProjectSlug();
  const [flatRows] = await pool.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [flatSlug]);
  return flatRows[0]?.id || null;
}

function redirectPathForLookup(pathname, projectSlug) {
  const path = normalizeRedirectPath(pathname);
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === projectSlug && segments.length >= 2) {
    return normalizeRedirectPath(`/${segments.slice(1).join('/')}`);
  }
  return path;
}

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get('path') || '/';
  const host = searchParams.get('host') || '';

  try {
    const projectId = await resolveProjectId(host, path);
    if (!projectId) return NextResponse.json({ redirect: null });

    const [projRows] = await getDbPool().query(`SELECT slug FROM projects WHERE id = ? LIMIT 1`, [projectId]);
    const projectSlug = projRows[0]?.slug || '';
    const lookupPath = redirectPathForLookup(path, projectSlug);
    const hit = await resolveSeoRedirect(projectId, lookupPath);
    if (!hit) return NextResponse.json({ redirect: null });

    return NextResponse.json({
      redirect: {
        destination: hit.destination,
        status: hit.status,
        projectSlug,
      },
    });
  } catch {
    return NextResponse.json({ redirect: null });
  }
}
