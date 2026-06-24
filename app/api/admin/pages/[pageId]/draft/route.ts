import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  resolvePageProjectId,
  updateAdminPageDraft,
} from '@/services/admin/adminPagesService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  const projectId = await resolvePageProjectId(pageId);
  if (!projectId) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
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
    const page = await updateAdminPageDraft(pageId, {
      content: body.content,
      createRevision: body.createRevision === true,
      createdById: auth.user?.id ? BigInt(auth.user.id) : null,
    });
    return NextResponse.json({ page });
  } catch (error) {
    return mapAdminApiError(error);
  }
}
