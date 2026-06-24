import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { AdminProjectValidationError } from '@/lib/admin/adminProjectInput';
import { verifyAdminProjectDomain } from '@/services/admin/verifyProjectDomainService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function mapError(error: unknown) {
  if (error instanceof AdminProjectValidationError) {
    const status =
      error.message === 'Project not found' || error.message === 'Invalid projectId' ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}

async function readRequestHost(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-host');
  const host = headerStore.get('host');
  return String(forwarded || host || '').trim();
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, minRole: 'admin', action: 'write' });
  if (auth.error) return auth.error;

  try {
    const requestHost = await readRequestHost();
    const result = await verifyAdminProjectDomain(projectId, requestHost);
    return NextResponse.json(result);
  } catch (error) {
    return mapError(error);
  }
}
