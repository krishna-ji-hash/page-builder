import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createBlogTag, listBlogTags } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    const tags = await listBlogTags(projectId);
    return NextResponse.json({ ok: true, tags });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to list tags' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const tag = await createBlogTag(projectId, body);
    return NextResponse.json({ ok: true, tag }, { status: 201 });
  } catch (e) {
    const status = /required|already exists/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to create tag' }, { status });
  }
}
