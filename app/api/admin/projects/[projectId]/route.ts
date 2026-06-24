import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { AdminProjectValidationError } from '@/lib/admin/adminProjectInput';
import {
  archiveAdminProject,
  updateAdminProject,
} from '@/services/admin/adminProjectsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function mapError(error: unknown) {
  if (error instanceof AdminProjectValidationError) {
    const status =
      error.code === 'CONFLICT'
        ? 409
        : error.message === 'Project not found' || error.message === 'Invalid projectId'
          ? 404
          : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function PUT(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, minRole: 'admin', action: 'write' });
  if (auth.error) return auth.error;

  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const project = await updateAdminProject(projectId, {
      name: body.name,
      slug: body.slug,
      domain: body.domain,
      status: body.status,
      homeSlug: body.homeSlug,
    });
    return NextResponse.json({ project });
  } catch (error) {
    return mapError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, minRole: 'admin', action: 'write' });
  if (auth.error) return auth.error;

  try {
    const project = await archiveAdminProject(projectId);
    return NextResponse.json({ project, archived: true });
  } catch (error) {
    return mapError(error);
  }
}
