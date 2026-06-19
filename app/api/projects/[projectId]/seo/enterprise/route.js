import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { runEnterpriseSeoSuite } from '@/services/seo/enterpriseSeoService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const suite = await runEnterpriseSeoSuite(projectId);
    return ok({ suite });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to load enterprise SEO suite', 500, message);
  }
}
