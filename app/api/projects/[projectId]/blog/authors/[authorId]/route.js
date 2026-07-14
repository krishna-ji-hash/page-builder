import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteBlogAuthor, updateBlogAuthor } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const authorId = Number(resolved.authorId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const author = await updateBlogAuthor(projectId, authorId, body);
    return NextResponse.json({ ok: true, author });
  } catch (e) {
    const status = /not found/i.test(e?.message || '')
      ? 404
      : /required/i.test(e?.message || '')
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update author' }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const authorId = Number(resolved.authorId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const ok = await deleteBlogAuthor(projectId, authorId);
    if (!ok) return NextResponse.json({ ok: false, error: 'Author not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to delete author' }, { status: 500 });
  }
}
