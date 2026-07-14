import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  createBlogCategory,
  listBlogCategories,
} from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    const categories = await listBlogCategories(projectId);
    return NextResponse.json({ ok: true, categories });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to list categories' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const category = await createBlogCategory(projectId, body);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e) {
    const status = /required|already exists/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to create category' }, { status });
  }
}
