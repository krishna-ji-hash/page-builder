import { fail, ok, parseJsonBody } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import {
  getActiveProject,
  getSiteSettings,
  setActiveProjectId,
} from '@/services/platform/siteSettingService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;
  try {
    const settings = await getSiteSettings();
    const activeProject = await getActiveProject();
    return ok({
      settings: {
        id: settings.id,
        activeProjectId: settings.activeProjectId ? Number(settings.activeProjectId) : null,
      },
      activeProject: activeProject
        ? {
            id: Number(activeProject.id),
            slug: activeProject.slug,
            name: activeProject.name,
            domain: activeProject.domain,
            homeSlug: activeProject.homeSlug,
          }
        : null,
    });
  } catch (error) {
    return fail('Failed to load site settings', 500, error.message);
  }
}

export async function PATCH(request) {
  const auth = await guardAdminApi(request, { minRole: 'admin' });
  if (auth.error) return auth.error;
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);
  try {
    if (body.activeProjectId !== undefined) {
      await setActiveProjectId(body.activeProjectId);
    }
    const settings = await getSiteSettings();
    const activeProject = await getActiveProject();
    return ok({
      settings: {
        id: settings.id,
        activeProjectId: settings.activeProjectId ? Number(settings.activeProjectId) : null,
      },
      activeProject: activeProject
        ? {
            id: Number(activeProject.id),
            slug: activeProject.slug,
            name: activeProject.name,
            domain: activeProject.domain,
            homeSlug: activeProject.homeSlug,
          }
        : null,
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('archived')) {
      return fail(error.message, 404);
    }
    return fail('Failed to update site settings', 500, error.message);
  }
}
