import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  deleteAdminMenuItem,
  resolveMenuItemProjectId,
  updateAdminMenuItem,
} from '@/services/admin/adminMenusService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { itemId } = await context.params;
  const projectId = await resolveMenuItemProjectId(itemId);
  if (!projectId) {
    return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
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
    const result = await updateAdminMenuItem(itemId, {
      label: body.label,
      url: body.url,
      pageId: body.pageId,
      target: body.target,
      sortOrder: body.sortOrder,
      parentId: body.parentId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { itemId } = await context.params;
  const projectId = await resolveMenuItemProjectId(itemId);
  if (!projectId) {
    return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const result = await deleteAdminMenuItem(itemId);
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
