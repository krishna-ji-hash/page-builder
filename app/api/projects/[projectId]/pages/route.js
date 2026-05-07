import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  createPageForProject,
  listPagesByProject,
} from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
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
    return ok({ page }, 201);
  } catch (error) {
    if (error.message === 'Project not found') return fail(error.message, 404);
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to create page', 500, error.message);
  }
}

