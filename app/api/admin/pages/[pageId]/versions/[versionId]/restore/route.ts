import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolvePageProjectId } from '@/services/admin/adminPagesService';
import { restoreAdminPageVersion } from '@/services/admin/adminPageVersionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ pageId: string; versionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { pageId, versionId } = await context.params;
  const projectId = await resolvePageProjectId(pageId);
  if (!projectId) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const result = await restoreAdminPageVersion(
      pageId,
      versionId,
      auth.user?.id ? BigInt(auth.user.id) : null
    );
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
