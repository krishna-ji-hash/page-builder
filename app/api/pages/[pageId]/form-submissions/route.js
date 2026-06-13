import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { getPageProjectId } from '@/lib/auth/pageProject';
import {
  buildFormSubmissionsCsv,
  csvExportResponse,
  logFormExportActivity,
} from '@/lib/admin/formExport';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { listFormSubmissions } from '@/services/forms/formSubmissionsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const pageProjectId = await getPageProjectId(pageId);
  const auth = await guardAdminApi(request, { projectId: pageProjectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  const url = new URL(request.url);
  const formNodeId = url.searchParams.get('formNodeId') || '';
  const projectId = Number(url.searchParams.get('projectId'));
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('projectId query is required', 400);
  }

  const limit = Number(url.searchParams.get('limit') || 500);
  const format = String(url.searchParams.get('format') || 'json').toLowerCase();

  try {
    const rows = await listFormSubmissions({
      projectId,
      pageId,
      formNodeId: formNodeId || null,
      limit,
    });

    if (format === 'csv') {
      const csv = buildFormSubmissionsCsv(rows);
      await logFormExportActivity({
        userId: auth.user.id,
        projectId,
        pageId,
        formNodeId: formNodeId || null,
        count: rows.length,
      });
      return csvExportResponse(csv);
    }

    return ok({ submissions: rows });
  } catch (err) {
    return fail('Failed to load submissions', 500, err instanceof Error ? err.message : String(err));
  }
}
