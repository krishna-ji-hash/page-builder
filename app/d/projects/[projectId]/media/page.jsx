import { redirect } from 'next/navigation';
import { adminActivePathOpts, adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { resolveAdminProjectKey } from '@/lib/admin/resolveAdminProject';
import { getActiveProject } from '@/services/platform/siteSettingService';

export const dynamic = 'force-dynamic';

export default async function DProjectMediaRedirect({ params }) {
  const { projectId } = await params;
  const project = await resolveAdminProjectKey(String(projectId));
  if (!project) redirect('/admin/projects');
  const active = await getActiveProject();
  redirect(adminProjectSectionPath(project, 'media', adminActivePathOpts(active)));
}
