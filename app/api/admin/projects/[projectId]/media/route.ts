import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { listAdminProjectMedia } from '@/services/admin/adminMediaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function clampInt(v: string | null, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function GET(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  try {
    const data = await listAdminProjectMedia(projectId, {
      q: searchParams.get('q') || '',
      kind: searchParams.get('kind') || '',
      folder: searchParams.has('folder') ? searchParams.get('folder') : undefined,
      sort: searchParams.get('sort') || 'created_desc',
      page: clampInt(searchParams.get('page'), 1, 100000, 1),
      pageSize: clampInt(searchParams.get('pageSize'), 1, 120, 48),
      recentOnly: searchParams.get('recent') === '1',
    });
    return NextResponse.json(data);
  } catch (error) {
    return mapAdminApiError(error);
  }
}
