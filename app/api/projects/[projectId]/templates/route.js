import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { listProjectTemplates, savePageTemplate } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const templates = await listProjectTemplates(projectId);
    return ok({ templates });
  } catch (error) {
    return fail('Failed to load templates', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const body = await request.json();
    const pageId = Number(body?.pageId);
    if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
    const template = await savePageTemplate({ pageId, name: body?.name || 'Untitled Template' });
    return ok({ template }, 201);
  } catch (error) {
    return fail('Failed to save template', 500, error.message);
  }
}

