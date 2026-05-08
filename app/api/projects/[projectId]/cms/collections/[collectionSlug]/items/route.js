import { NextResponse } from 'next/server';
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

export async function GET(req, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const collectionSlug = String(resolved.collectionSlug || '');
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const q = parseQuery(req.url);
    const items = await listItemsByCollectionSlug(projectId, collectionSlug, q);
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to list items' },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    const collectionSlug = String(resolved.collectionSlug || '');
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const item = await createItem(projectId, collectionSlug, body);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}

