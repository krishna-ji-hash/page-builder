import { fail } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import {
  BACKUP_EXPORT_TYPES,
  backupFilename,
  csvDownloadResponse,
  jsonDownloadResponse,
  normalizeBackupExportType,
} from '@/lib/admin/backupExport';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import {
  exportCmsJson,
  exportPageSnapshotsJson,
  exportProjectFormsCsv,
  exportProjectJson,
} from '@/services/admin/projectBackupService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }

  const type = normalizeBackupExportType(new URL(request.url).searchParams.get('type'));
  if (!type) {
    return fail('type query is required: project | pages | cms | forms', 400);
  }

  try {
    if (type === BACKUP_EXPORT_TYPES.PROJECT) {
      const data = await exportProjectJson(projectId);
      if (!data) return fail('Project not found', 404);
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        action: ACTIVITY_ACTIONS.BACKUP_EXPORTED,
        metadata: { type, slug: data.project?.slug },
      });
      return jsonDownloadResponse(data, backupFilename(data.project.slug, 'project', 'json'));
    }

    if (type === BACKUP_EXPORT_TYPES.PAGES) {
      const data = await exportPageSnapshotsJson(projectId);
      if (!data) return fail('Project not found', 404);
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        action: ACTIVITY_ACTIONS.BACKUP_EXPORTED,
        metadata: { type, slug: data.projectSlug, pageCount: data.pages?.length || 0 },
      });
      return jsonDownloadResponse(data, backupFilename(data.projectSlug, 'pages', 'json'));
    }

    if (type === BACKUP_EXPORT_TYPES.CMS) {
      const data = await exportCmsJson(projectId);
      if (!data) return fail('Project not found', 404);
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        action: ACTIVITY_ACTIONS.BACKUP_EXPORTED,
        metadata: { type, slug: data.projectSlug, collectionCount: data.collections?.length || 0 },
      });
      return jsonDownloadResponse(data, backupFilename(data.projectSlug, 'cms', 'json'));
    }

    if (type === BACKUP_EXPORT_TYPES.FORMS) {
      const data = await exportProjectFormsCsv(projectId);
      if (!data) return fail('Project not found', 404);
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        action: ACTIVITY_ACTIONS.BACKUP_EXPORTED,
        metadata: { type, slug: data.projectSlug, count: data.count },
      });
      return csvDownloadResponse(data.csv, backupFilename(data.projectSlug, 'forms', 'csv'));
    }

    return fail('Unknown export type', 400);
  } catch (error) {
    return fail('Backup export failed', 500, error.message);
  }
}
