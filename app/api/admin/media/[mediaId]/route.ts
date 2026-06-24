import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { deleteAdminMedia, resolveMediaProjectId } from '@/services/admin/adminMediaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ mediaId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const projectId = await resolveMediaProjectId(mediaId);
  if (!projectId) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const result = await deleteAdminMedia(mediaId);
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
