import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { updateSeoRedirect, deleteSeoRedirect } from '@/services/seo/seoRedirectService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const redirectId = Number(resolved.redirectId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(redirectId) || redirectId <= 0) return fail('Invalid redirectId', 400);
  try {
    const body = await request.json().catch(() => ({}));
    const redirect = await updateSeoRedirect(projectId, redirectId, body);
    return ok({ redirect });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Redirect not found') return fail(message, 404);
    return fail('Failed to update redirect', 400, message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const redirectId = Number(resolved.redirectId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  if (!Number.isInteger(redirectId) || redirectId <= 0) return fail('Invalid redirectId', 400);
  try {
    await deleteSeoRedirect(projectId, redirectId);
    return ok({ deleted: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Redirect not found') return fail(message, 404);
    return fail('Failed to delete redirect', 500, message);
  }
}
