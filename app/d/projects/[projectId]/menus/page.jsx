import { redirect } from 'next/navigation';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { resolveAdminProjectKey } from '@/lib/admin/resolveAdminProject';

export const dynamic = 'force-dynamic';

export default async function DProjectMenusRedirect({ params }) {
  const { projectId } = await params;
  const project = await resolveAdminProjectKey(String(projectId));
  if (!project) redirect('/admin/projects');
  redirect(adminProjectSectionPath(project.slug, 'menus'));
}
