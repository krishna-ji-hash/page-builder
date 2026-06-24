import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  deleteAdminMenu,
  resolveMenuProjectId,
  updateAdminMenu,
} from '@/services/admin/adminMenusService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ menuId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { menuId } = await context.params;
  const projectId = await resolveMenuProjectId(menuId);
  if (!projectId) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
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
    const menu = await updateAdminMenu(menuId, {
      name: body.name,
      location: body.location,
    });
    return NextResponse.json({ menu });
  } catch (error) {
    return mapAdminApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { menuId } = await context.params;
  const projectId = await resolveMenuProjectId(menuId);
  if (!projectId) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const result = await deleteAdminMenu(menuId);
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
