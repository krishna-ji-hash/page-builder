import { fail, ok, parseJsonBody } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  createPageForProject,
  listPagesByProject,
} from '@/services/builder/builderService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }
  try {
    const pages = await listPagesByProject(projectId);
    return ok({ pages });
  } catch (error) {
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    return fail('Failed to list pages', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }

  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }

  try {
    const page = await createPageForProject(projectId, {
      title: body.title,
      slug: body.slug,
      createStarter: body.createStarter !== false,
    });
    void recordAdminActivity({
      userId: auth.user.id,
      projectId,
      pageId: page?.id,
      action: ACTIVITY_ACTIONS.PAGE_CREATED,
      metadata: { slug: page?.slug, title: page?.title },
    });
    return ok({ page }, 201);
  } catch (error) {
    if (error.message === 'Project not found') return fail(error.message, 404);
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to create page', 500, error.message);
  }
}

