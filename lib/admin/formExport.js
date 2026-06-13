import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { buildFormSubmissionsCsv } from '@/lib/admin/formSubmissionsCsv';
import { recordAdminActivity } from '@/services/admin/activityLogService';

export { buildFormSubmissionsCsv };

export async function logFormExportActivity({ userId, projectId, pageId, formNodeId, count, format = 'csv' }) {
  void recordAdminActivity({
    userId,
    projectId,
    pageId,
    action: ACTIVITY_ACTIONS.FORM_EXPORTED,
    metadata: { formNodeId: formNodeId || null, count, format },
  });
}

export function csvExportResponse(csv, filename = 'form-submissions.csv') {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
