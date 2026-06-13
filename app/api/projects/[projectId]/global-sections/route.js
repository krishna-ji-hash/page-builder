import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { removeGlobalSection, saveGlobalSection } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const pageId = Number(body?.pageId);
    const rowId = Number(body?.rowId);
    const role = typeof body?.role === 'string' ? body.role : '';
    if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
    if (!Number.isInteger(rowId) || rowId <= 0) return fail('Invalid rowId', 400);
    const globalSections = await saveGlobalSection({ pageId, rowId, role });
    return ok({ globalSections }, 201);
  } catch (error) {
    return fail('Failed to save global section', 500, error.message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'manage' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const role = typeof body?.role === 'string' ? body.role : '';
    const globalSections = await removeGlobalSection({ projectId, role });
    return ok({ globalSections });
  } catch (error) {
    return fail('Failed to remove global section', 500, error.message);
  }
}

