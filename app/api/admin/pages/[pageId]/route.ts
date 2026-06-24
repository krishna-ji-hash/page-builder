import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  deleteAdminPage,
  getAdminPage,
  resolvePageProjectId,
  updateAdminPage,
} from '@/services/admin/adminPagesService';

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
    const result = await getAdminPage(pageId);
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}

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
    const page = await updateAdminPage(pageId, {
      title: body.title,
      slug: body.slug,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      ogImage: body.ogImage,
      robotsIndex: body.robotsIndex,
      robotsFollow: body.robotsFollow,
      canonicalUrl: body.canonicalUrl,
    });
    return NextResponse.json({ page });
  } catch (error) {
    return mapAdminApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  const projectId = await resolvePageProjectId(pageId);
  if (!projectId) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  try {
    const result = await deleteAdminPage(pageId);
    return NextResponse.json(result);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
