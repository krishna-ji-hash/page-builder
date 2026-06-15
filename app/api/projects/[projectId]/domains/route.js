import { fail, ok, parseJsonBody } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { buildDnsInstructions } from '@/lib/platform/domainDns';
import { allowManualDomainVerify } from '@/lib/platform/domainVerification';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  addProjectDomain,
  listProjectDomains,
} from '@/services/platform/domainService';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function domainsMeta() {
  return {
    serverIp: buildDnsInstructions('example.com', 'token').serverIp,
    manualVerifyAllowed: allowManualDomainVerify(),
  };
}

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  try {
    const domains = await listProjectDomains(projectId);
    return ok({ domains, meta: domainsMeta() });
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return fail('Domains table not found — run database migrations', 503, {
        hint: 'npm run db:migrate',
      });
    }
    return fail('Failed to list domains', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
  if (auth.error) return auth.error;
  const projectId = Number(resolved.projectId);
  const body = await parseJsonBody(request);
  if (!body?.domain) return fail('domain is required', 400);
  try {
    const domain = await addProjectDomain(projectId, body.domain);
    void recordAdminActivity({
      userId: auth.user.id,
      projectId,
      action: ACTIVITY_ACTIONS.DOMAIN_ADDED,
      metadata: { domain: domain?.domain, domainId: domain?.id },
    });
    return ok({ domain }, 201);
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return fail('Domains table not found — run database migrations', 503);
    }
    if (error.message.includes('already')) return fail(error.message, 409);
    if (error.message === 'Project not found') return fail(error.message, 404);
    if (error.message.startsWith('Invalid') || error.message.startsWith('Enter') || error.message.startsWith('Use')) {
      return fail(error.message, 400);
    }
    return fail('Failed to add domain', 500, error.message);
  }
}
