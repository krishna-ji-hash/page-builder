import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { listMediaAssets } from '@/services/builder/mediaService';
import { processProjectMediaUpload } from '@/lib/media/processProjectMediaUpload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const kind = searchParams.get('kind') || '';
  const folder = searchParams.get('folder');
  const sort = searchParams.get('sort') || 'created_desc';
  const page = clampInt(searchParams.get('page'), 1, 100000, 1);
  const pageSize = clampInt(searchParams.get('pageSize'), 1, 120, 48);
  const recentOnly = searchParams.get('recent') === '1';

  try {
    const data = await listMediaAssets({ projectId, q, kind, folder, sort, page, pageSize, recentOnly });
    return ok(data);
  } catch (error) {
    return fail('Failed to list media', 500, error?.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  let form;
  try {
    form = await request.formData();
  } catch (error) {
    return fail('Invalid form data', 400, error?.message);
  }

  try {
    const { item } = await processProjectMediaUpload({ projectId, form });
    return ok({ item }, 201);
  } catch (error) {
    const status = error?.status || 500;
    return fail(error?.message || 'Upload failed', status, error?.details);
  }
}

