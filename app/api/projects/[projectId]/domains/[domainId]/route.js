import { fail, ok } from '@/lib/api';
import {
  setPrimaryProjectDomain,
  verifyProjectDomain,
} from '@/services/platform/domainService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const projectId = Number((await params).projectId);
  const domainId = Number((await params).domainId);
  const action = request.nextUrl.searchParams.get('action');
  try {
    if (action === 'verify') {
      const domains = await verifyProjectDomain(projectId, domainId);
      return ok({ domains });
    }
    if (action === 'primary') {
      const domains = await setPrimaryProjectDomain(projectId, domainId);
      return ok({ domains });
    }
    return fail('Unknown action', 400);
  } catch (error) {
    return fail('Domain action failed', 500, error.message);
  }
}
