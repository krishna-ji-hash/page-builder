import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminProjectSettings from '@/components/admin/workspace/AdminProjectSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project settings',
};

export default async function ProjectSettingsPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return <AdminProjectSettings projectId={projectId} />;
}
