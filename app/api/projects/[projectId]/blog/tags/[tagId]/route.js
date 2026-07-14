import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteBlogTag, updateBlogTag } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const tagId = Number(resolved.tagId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const tag = await updateBlogTag(projectId, tagId, body);
    return NextResponse.json({ ok: true, tag });
  } catch (e) {
    const status = /not found/i.test(e?.message || '')
      ? 404
      : /required|already exists/i.test(e?.message || '')
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update tag' }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const tagId = Number(resolved.tagId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const ok = await deleteBlogTag(projectId, tagId);
    if (!ok) return NextResponse.json({ ok: false, error: 'Tag not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to delete tag' }, { status: 500 });
  }
}
