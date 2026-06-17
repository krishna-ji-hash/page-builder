import { getProjectById, getProjectBySlug } from '@/services/builder/builderService';

/** Resolve `/admin/projects/:key` segment to a project row (slug or legacy numeric id). */
export async function resolveAdminProjectKey(key) {
  const raw = String(key ?? '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    return getProjectById(Number(raw));
  }
  return getProjectBySlug(raw);
}
