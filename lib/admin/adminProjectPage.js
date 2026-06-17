import { notFound, redirect } from 'next/navigation';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { resolveAdminProjectKey } from '@/lib/admin/resolveAdminProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

/**
 * Resolve admin project workspace routes (`/admin/projects/:projectSlug/...`).
 * Redirects legacy numeric URLs (`/admin/projects/14/...`) to slug URLs.
 */
export async function resolveAdminProjectRoute(params, section = 'overview') {
  const resolved = await resolveMaybeAsyncParams(params);
  const key = String(resolved.projectSlug ?? resolved.projectId ?? '').trim();
  if (!key) notFound();

  const project = await resolveAdminProjectKey(key);
  if (!project) notFound();

  const sec = String(section || 'overview').trim() || 'overview';

  if (/^\d+$/.test(key) && project.slug) {
    redirect(adminProjectSectionPath(project.slug, sec));
  }

  return {
    projectId: project.id,
    projectSlug: project.slug,
    projectName: project.name,
    project,
  };
}
