import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  getBlogPostStats,
  listBlogPosts,
  createBlogPost,
} from '@/services/blog/blogService';

export const runtime = 'nodejs';

function parseListQuery(url) {
  const u = new URL(url);
  return {
    status: u.searchParams.get('status') || 'all',
    categoryId: u.searchParams.get('categoryId') || undefined,
    authorId: u.searchParams.get('authorId') || undefined,
    q: u.searchParams.get('q') || '',
    limit: u.searchParams.get('limit') != null ? Number(u.searchParams.get('limit')) : 50,
    offset: u.searchParams.get('offset') != null ? Number(u.searchParams.get('offset')) : 0,
  };
}

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }

    const u = new URL(request.url);
    if (u.searchParams.get('stats') === '1') {
      const stats = await getBlogPostStats(projectId);
      return NextResponse.json({ ok: true, stats });
    }

    const q = parseListQuery(request.url);
    const result = await listBlogPosts(projectId, {
      ...q,
      categoryId: q.categoryId ? Number(q.categoryId) : undefined,
      authorId: q.authorId ? Number(q.authorId) : undefined,
    });
    const stats = await getBlogPostStats(projectId);
    return NextResponse.json({ ok: true, ...result, stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to list blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const post = await createBlogPost(projectId, body);
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (e) {
    const status = /required|already exists/i.test(e?.message || '') ? 400 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to create post' }, { status });
  }
}
