import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { AdminProjectValidationError } from '@/lib/admin/adminProjectInput';
import {
  createAdminProject,
  listAdminProjects,
} from '@/services/admin/adminProjectsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapError(error: unknown) {
  return mapAdminApiError(error);
}

export async function GET(request: Request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;

  try {
    const projects = await listAdminProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(request: Request) {
  const auth = await guardAdminApi(request, { minRole: 'admin' });
  if (auth.error) return auth.error;

  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await createAdminProject({
      name: body.name,
      slug: body.slug,
      domain: body.domain,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return mapError(error);
  }
}
