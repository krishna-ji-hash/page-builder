import { NextResponse } from 'next/server';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { deleteItem, updateItem } from '@/services/builder/cmsService';

export const runtime = 'nodejs';

export async function PATCH(req, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const collectionSlug = String(resolved.collectionSlug || '');
  const itemId = Number(resolved.itemId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
  }
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid itemId' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  await updateItem(projectId, collectionSlug, itemId, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const collectionSlug = String(resolved.collectionSlug || '');
  const itemId = Number(resolved.itemId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
  }
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid itemId' }, { status: 400 });
  }
  await deleteItem(projectId, collectionSlug, itemId);
  return NextResponse.json({ ok: true });
}

