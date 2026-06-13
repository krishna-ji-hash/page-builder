import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminProjectCms from '@/components/admin/workspace/AdminProjectCms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'CMS Collections',
  description: 'Manage CMS collections and items',
};

export default async function ProjectCmsPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return <AdminProjectCms projectId={projectId} />;
}
