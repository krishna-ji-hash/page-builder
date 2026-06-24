import { fail, ok } from '@/lib/api';
import { resolveProjectSlugFromHost } from '@/services/platform/domainService';
import { getDbPool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveProjectMetaFromHost(host) {
  const projectSlug = await resolveProjectSlugFromHost(host);
  if (!projectSlug) return null;
  try {
    const [rows] = await getDbPool().query(
      `SELECT slug, home_slug AS homeSlug FROM projects WHERE slug = ? AND status = 'ACTIVE' LIMIT 1`,
      [projectSlug]
    );
    if (!rows.length) return { projectSlug, homeSlug: 'home' };
    return { projectSlug: rows[0].slug, homeSlug: rows[0].homeSlug || 'home' };
  } catch {
    return { projectSlug, homeSlug: 'home' };
  }
}

export async function GET(request) {
  const host = request.nextUrl.searchParams.get('host') || request.headers.get('host');
  if (!host) return fail('host is required', 400);
  try {
    const meta = await resolveProjectMetaFromHost(host);
    if (!meta?.projectSlug) return ok({ projectSlug: null, homeSlug: null });
    return ok(meta);
  } catch (error) {
    return fail('Failed to resolve host', 500, error.message);
  }
}
