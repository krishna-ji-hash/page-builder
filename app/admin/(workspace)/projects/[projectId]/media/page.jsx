import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminStubPage from '@/components/admin/workspace/AdminStubPage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Media',
};

export default async function ProjectMediaPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return (
    <AdminStubPage
      title="Media"
      description="Project media library — upload and manage assets."
      phase="a later phase"
    />
  );
}
