import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { AdminProjectValidationError } from '@/lib/admin/adminProjectInput';
import { deleteAdminProjectPermanently } from '@/services/admin/adminProjectsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function mapError(error: unknown) {
  if (error instanceof AdminProjectValidationError) {
    const status =
      error.message === 'Project not found' || error.message === 'Invalid projectId'
        ? 404
        : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, minRole: 'admin', action: 'manage' });
  if (auth.error) return auth.error;

  try {
    const result = await deleteAdminProjectPermanently(projectId);
    return NextResponse.json(result);
  } catch (error) {
    return mapError(error);
  }
}
