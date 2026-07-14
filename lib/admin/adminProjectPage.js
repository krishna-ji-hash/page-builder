import { notFound, redirect } from 'next/navigation';
import {
  adminFlatProjectSectionPath,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';
import { resolveAdminProjectKey } from '@/lib/admin/resolveAdminProject';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getActiveProject } from '@/services/platform/siteSettingService';

function withSectionSubPath(basePath, subPath = '') {
  const trail = String(subPath || '')
    .replace(/^\/+|\/+$/g, '')
    .trim();
  return trail ? `${basePath}/${trail}` : basePath;
}

/**
 * Resolve admin project workspace routes (`/admin/projects/:projectSlug/...`).
 * Redirects legacy numeric URLs (`/admin/projects/14/...`) to slug URLs.
 * Redirects active/default project to flat URLs (`/admin/projects/pages`).
 * Optional `subPath` preserves nested paths (e.g. blog/categories → /admin/projects/blog/categories).
 */
export async function resolveAdminProjectRoute(params, section = 'overview', subPath = '') {
  const resolved = await resolveMaybeAsyncParams(params);
  const key = String(resolved.projectSlug ?? resolved.projectId ?? '').trim();
  if (!key) notFound();

  const project = await resolveAdminProjectKey(key);
  if (!project) notFound();

  const sec = String(section || 'overview').trim() || 'overview';
  const active = await getActiveProject();
  const isActive = active && Number(active.id) === Number(project.id);

  if (/^\d+$/.test(key) && project.slug) {
    redirect(
      withSectionSubPath(
        isActive ? adminFlatProjectSectionPath(sec) : adminProjectSectionPath(project.slug, sec),
        subPath
      )
    );
  }

  if (isActive) {
    redirect(withSectionSubPath(adminFlatProjectSectionPath(sec), subPath));
  }

  return {
    projectId: Number(project.id),
    projectSlug: project.slug,
    projectName: project.name,
    activeProjectId: active ? Number(active.id) : null,
    activeProjectSlug: active?.slug ?? null,
    project: {
      id: Number(project.id),
      name: project.name,
      slug: project.slug,
      domain: project.domain,
      homeSlug: project.homeSlug,
      type: project.type,
      status: project.status,
    },
  };
}

/** Flat route `/admin/projects/:section` — active localhost-default project. */
export async function resolveAdminActiveProjectRoute(section = 'overview') {
  const active = await getActiveProject();
  if (!active) notFound();

  const sec = String(section || 'overview').trim() || 'overview';

  return {
    projectId: Number(active.id),
    projectSlug: active.slug,
    projectName: active.name,
    activeProjectId: Number(active.id),
    activeProjectSlug: active.slug,
    project: {
      id: Number(active.id),
      name: active.name,
      slug: active.slug,
      domain: active.domain,
      homeSlug: active.homeSlug,
      type: active.type,
      status: active.status,
    },
  };
}
