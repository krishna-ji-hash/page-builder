import { notFound, redirect } from 'next/navigation';
import {
  PROJECT_SECTION_IDS,
  adminFlatProjectSectionPath,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';
import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';

export default async function ProjectIndexPage({ params }) {
  const resolved = await params;
  const key = String(resolved.projectId ?? '').trim();
  if (PROJECT_SECTION_IDS.has(key)) {
    redirect(adminFlatProjectSectionPath(key));
  }

  const { projectSlug } = await resolveAdminProjectRoute(params, 'overview');
  redirect(adminProjectSectionPath(projectSlug, 'overview'));
}
