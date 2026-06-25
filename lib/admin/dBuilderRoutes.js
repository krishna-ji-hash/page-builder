import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';

/** Builder editor — prefer slug path; legacy page-id URLs redirect via /d/builder. */
export function dBuilderPagePath(pageId, projectSlug, pageSlug, active) {
  if (projectSlug && pageSlug) {
    return adminBuilderPagePath(projectSlug, pageSlug, active);
  }
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) return `${ADMIN_PROJECTS_PATH}/pages`;
  return `/admin/builder/page/${id}`;
}

/** Draft preview — same slugs as public and builder routes. */
export function dPreviewPagePath(pageId, projectSlug, pageSlug) {
  if (projectSlug && pageSlug) {
    return previewPagePath(projectSlug, pageSlug);
  }
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `/d/preview/${id}`;
}
