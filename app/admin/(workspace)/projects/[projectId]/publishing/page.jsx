import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminProjectPublishing from '@/components/admin/workspace/AdminProjectPublishing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project publishing',
};

export default async function ProjectPublishingPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return <AdminProjectPublishing projectId={projectId} />;
}
