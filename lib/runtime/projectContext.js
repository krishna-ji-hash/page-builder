import { getDbPool } from '@/lib/db';

function safeSlug(s) {
  const v = typeof s === 'string' ? s.trim() : '';
  if (!v) return '';
  if (!/^[a-z0-9-]{2,80}$/i.test(v)) return '';
  return v.toLowerCase();
}

export async function resolveProjectIdFromRequest(request) {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const projectIdRaw = sp.get('projectId');
  const projectId = projectIdRaw != null && projectIdRaw !== '' ? Number(projectIdRaw) : null;
  if (Number.isInteger(projectId) && projectId > 0) return projectId;

  const projectSlugParam = safeSlug(sp.get('projectSlug') || '');
  let projectSlug = projectSlugParam;

  if (!projectSlug) {
    const ref = request.headers.get('referer') || '';
    try {
      const refUrl = new URL(ref);
      const path = refUrl.pathname || '';
      const mPreview = path.match(/^\/preview\/([^/]+)/);
      if (mPreview?.[1]) projectSlug = safeSlug(mPreview[1]);
      if (!projectSlug) {
        const mPublic = path.match(/^\/([^/]+)/);
        const first = mPublic?.[1] ? safeSlug(mPublic[1]) : '';
        // ignore admin/api routes
        if (first && first !== 'admin' && first !== 'api' && first !== 'preview') projectSlug = first;
      }
    } catch {
      // ignore
    }
  }

  if (!projectSlug) return null;
  const pool = getDbPool();
  const [rows] = await pool.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [projectSlug]);
  const id = rows?.[0]?.id;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

