import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { saveGlobalSection } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
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

