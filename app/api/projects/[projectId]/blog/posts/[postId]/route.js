import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  duplicateBlogPost,
  getBlogPostById,
  setBlogPostStatus,
  softDeleteBlogPost,
  updateBlogPost,
} from '@/services/blog/blogService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const postId = Number(resolved.postId);
    const auth = await guardAdminApi(request, { projectId, action: 'read' });
    if (auth.error) return auth.error;
    const post = await getBlogPostById(projectId, postId);
    if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to load post' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const postId = Number(resolved.postId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const body = await request.json().catch(() => ({}));

    if (body?.action === 'duplicate') {
      const post = await duplicateBlogPost(projectId, postId);
      return NextResponse.json({ ok: true, post });
    }
    if (body?.action === 'publish') {
      const post = await setBlogPostStatus(projectId, postId, 'published');
      return NextResponse.json({ ok: true, post });
    }
    if (body?.action === 'unpublish') {
      const post = await setBlogPostStatus(projectId, postId, 'draft');
      return NextResponse.json({ ok: true, post });
    }
    if (body?.action === 'archive') {
      const post = await setBlogPostStatus(projectId, postId, 'archived');
      return NextResponse.json({ ok: true, post });
    }

    const post = await updateBlogPost(projectId, postId, body);
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    const status = /not found/i.test(e?.message || '')
      ? 404
      : /required|already exists/i.test(e?.message || '')
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update post' }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const postId = Number(resolved.postId);
    const auth = await guardAdminApi(request, { projectId, action: 'write' });
    if (auth.error) return auth.error;
    const ok = await softDeleteBlogPost(projectId, postId);
    if (!ok) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to delete post' }, { status: 500 });
  }
}
