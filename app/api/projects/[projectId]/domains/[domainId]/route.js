import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { DomainVerificationError } from '@/lib/platform/domainVerification';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  removeProjectDomain,
  setPrimaryProjectDomain,
  verifyProjectDomain,
  listProjectDomains,
} from '@/services/platform/domainService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  const domainId = Number(resolved.domainId);
  const action = request.nextUrl.searchParams.get('action');
  try {
    if (action === 'verify') {
      const result = await verifyProjectDomain(projectId, domainId);
      const verifiedDomain = (result?.domains || []).find((d) => Number(d.id) === domainId);
      if (verifiedDomain?.verified) {
        void recordAdminActivity({
          userId: auth.user.id,
          projectId,
          action: ACTIVITY_ACTIONS.DOMAIN_VERIFIED,
          metadata: { domain: verifiedDomain.domain, domainId },
        });
      }
      return ok(result);
    }
    if (action === 'primary') {
      const domains = await setPrimaryProjectDomain(projectId, domainId);
      return ok({ domains });
    }
    return fail('Unknown action', 400);
  } catch (error) {
    if (error instanceof DomainVerificationError) {
      const domains = await listProjectDomains(projectId);
      return fail(error.message, 422, {
        verificationError: error.verificationError,
        lastCheckedAt: error.lastCheckedAt,
        domains,
      });
    }
    if (error.message === 'Domain not found') return fail(error.message, 404);
    return fail('Domain action failed', 500, error.message);
  }
}

export async function DELETE(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'manage' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  const domainId = Number(resolved.domainId);
  try {
    const domains = await removeProjectDomain(projectId, domainId);
    return ok({ domains });
  } catch (error) {
    if (error.message === 'Domain not found') return fail(error.message, 404);
    return fail('Failed to remove domain', 500, error.message);
  }
}
