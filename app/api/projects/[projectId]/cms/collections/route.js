import { NextResponse } from 'next/server';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createCollection, listCollections } from '@/services/builder/cmsService';

export const runtime = 'nodejs';

export async function GET(_req, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const cols = await listCollections(projectId);
    return NextResponse.json({ ok: true, collections: cols });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to list collections' },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const projectId = Number(resolved.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const col = await createCollection(projectId, body);
    return NextResponse.json({ ok: true, collection: col });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}

