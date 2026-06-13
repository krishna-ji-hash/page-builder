import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createCollection, listCollections } from '@/services/builder/cmsService';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
    if (auth.error) return auth.error;
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

export async function POST(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
    if (auth.error) return auth.error;
    const projectId = Number(resolved.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const col = await createCollection(projectId, body);
    return NextResponse.json({ ok: true, collection: col });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}

