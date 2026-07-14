import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteBlogCategory, updateBlogCategory } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const categoryId = Number(resolved.categoryId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const category = await updateBlogCategory(projectId, categoryId, body);
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    const status = /not found/i.test(e?.message || '')
      ? 404
      : /required|already exists/i.test(e?.message || '')
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update category' }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const categoryId = Number(resolved.categoryId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const ok = await deleteBlogCategory(projectId, categoryId);
    if (!ok) return NextResponse.json({ ok: false, error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to delete category' }, { status: 500 });
  }
}
