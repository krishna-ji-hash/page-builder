import { notFound, redirect } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { adminProjectSectionPath } from '@/lib/admin/adminRoutes';

export default async function ProjectIndexPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  redirect(adminProjectSectionPath(projectId, 'overview'));
}
