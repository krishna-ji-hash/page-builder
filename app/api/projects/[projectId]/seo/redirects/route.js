import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  listSeoRedirects,
  createSeoRedirect,
  updateSeoRedirect,
  deleteSeoRedirect,
  validateRedirectLoops,
} from '@/services/seo/seoRedirectService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const redirects = await listSeoRedirects(projectId);
    const loops = validateRedirectLoops(redirects.filter((r) => r.active));
    return ok({ redirects, loops });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to load redirects', 500, message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json().catch(() => ({}));
    const redirect = await createSeoRedirect(projectId, body);
    return ok({ redirect });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to create redirect', 400, message);
  }
}
