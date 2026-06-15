import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getProjectSettingsSummary } from '@/services/admin/projectSettingsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  try {
    const summary = await getProjectSettingsSummary(projectId);
    if (!summary) return fail('Project not found', 404);
    return ok(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to load project settings', 500, message);
  }
}
