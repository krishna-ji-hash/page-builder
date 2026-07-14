import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createBlogAuthor, listBlogAuthors } from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    const authors = await listBlogAuthors(projectId);
    return NextResponse.json({ ok: true, authors });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to list authors' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));
    const author = await createBlogAuthor(projectId, body);
    return NextResponse.json({ ok: true, author }, { status: 201 });
  } catch (e) {
    const status = /required/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to create author' }, { status });
  }
}
