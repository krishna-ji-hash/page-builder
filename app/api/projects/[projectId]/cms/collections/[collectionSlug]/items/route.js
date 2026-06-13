import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createItem, listItemsByCollectionSlug } from '@/services/builder/cmsService';

export const runtime = 'nodejs';

function parseQuery(url) {
  const u = new URL(url);
  const limit = u.searchParams.get('limit');
  const sortBy = u.searchParams.get('sortBy');
  const sortDir = u.searchParams.get('sortDir');
  const status = u.searchParams.get('status');
  return {
    limit: limit != null ? Number(limit) : undefined,
    sortBy: sortBy || undefined,
    sortDir: sortDir || undefined,
    status: status || undefined,
  };
}

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
    if (auth.error) return auth.error;
    const projectId = Number(resolved.projectId);
    const collectionSlug = String(resolved.collectionSlug || '');
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const q = parseQuery(request.url);
    const items = await listItemsByCollectionSlug(projectId, collectionSlug, q);
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to list items' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
    if (auth.error) return auth.error;
    const projectId = Number(resolved.projectId);
    const collectionSlug = String(resolved.collectionSlug || '');
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const item = await createItem(projectId, collectionSlug, body);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}

