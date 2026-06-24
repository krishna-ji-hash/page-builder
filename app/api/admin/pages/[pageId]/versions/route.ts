import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolvePageProjectId } from '@/services/admin/adminPagesService';
import { listAdminPageVersions } from '@/services/admin/adminPageVersionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  const projectId = await resolvePageProjectId(pageId);
  if (!projectId) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;

  try {
    const versions = await listAdminPageVersions(pageId);
    return NextResponse.json({ versions });
  } catch (error) {
    return mapAdminApiError(error);
  }
}
