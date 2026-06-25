import { notFound } from 'next/navigation';
import { PROJECT_SECTIONS } from '@/lib/admin/adminRoutes';
import { ADMIN_SECTION_COMPONENTS } from '@/lib/admin/adminSectionRegistry';
import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';

export function activeProjectSectionMetadata(section) {
  const meta = PROJECT_SECTIONS.find((s) => s.id === section);
  return { title: meta?.label ? `${meta.label} · Project` : 'Project' };
}

function workspaceProjectProps(ctx) {
  return {
    projectId: ctx.projectId,
    initialProject: ctx.project,
    activeProjectId: ctx.activeProjectId,
    activeProjectSlug: ctx.activeProjectSlug,
  };
}

/** Active/default project — `/admin/projects/pages` (static segment beats `[projectId]`). */
export default async function ActiveProjectSectionPage({ section }) {
  const sec = String(section || '').trim();
  if (!PROJECT_SECTIONS.some((s) => s.id === sec)) notFound();

  const Component = ADMIN_SECTION_COMPONENTS[sec];
  if (!Component) notFound();

  const ctx = await resolveAdminActiveProjectRoute(sec);
  return <Component {...workspaceProjectProps(ctx)} />;
}
