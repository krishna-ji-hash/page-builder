import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  publishAdminPage,
  resolvePageProjectId,
} from '@/services/admin/adminPagesService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  const projectId = await resolvePageProjectId(pageId);
  if (!projectId) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const page = await publishAdminPage(
      pageId,
      auth.user?.id ? BigInt(auth.user.id) : null
    );
    return NextResponse.json({ page });
  } catch (error) {
    return mapAdminApiError(error);
  }
}
