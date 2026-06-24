import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { createAdminProjectMenu, listAdminProjectMenus } from '@/services/admin/adminMenusService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;

  try {
    const menus = await listAdminProjectMenus(projectId);
    return NextResponse.json({ menus });
  } catch (error) {
    return mapAdminApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
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
    const menu = await createAdminProjectMenu(projectId, {
      name: body.name,
      location: body.location,
    });
    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    return mapAdminApiError(error);
  }
}
