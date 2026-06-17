import { redirect } from 'next/navigation';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';
import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';

export default async function ProjectIndexPage({ params }) {
  const { projectSlug } = await resolveAdminProjectRoute(params, 'overview');
  redirect(adminProjectSectionPath(projectSlug, 'overview'));
}
