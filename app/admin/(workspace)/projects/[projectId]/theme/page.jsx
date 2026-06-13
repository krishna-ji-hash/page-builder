import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminStubPage from '@/components/admin/workspace/AdminStubPage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Theme',
};

export default async function ProjectThemePage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return (
    <AdminStubPage
      title="Theme"
      description="Site theme tokens and presets — use builder theme panel for full editing."
      phase="a later phase"
    />
  );
}
