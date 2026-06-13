import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AppManagerShell from '@/components/builder/apps/AppManagerShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App Manager',
  description: 'Enable/disable apps per project',
};

export default async function ProjectAppsPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return (
    <div className="platform-shell">
      <div className="admin-page__header">
        <h1>Apps</h1>
        <p>Enable or disable apps for this project.</p>
      </div>
      <AppManagerShell projectId={projectId} />
    </div>
  );
}
