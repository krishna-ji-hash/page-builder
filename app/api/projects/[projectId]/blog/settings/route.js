import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getBlogSettings, updateBlogSettings } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    const settings = await getBlogSettings(projectId);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const settings = await updateBlogSettings(projectId, body);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save settings' }, { status: 500 });
  }
}
