import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AppManagerShell from '@/components/builder/apps/AppManagerShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App Manager',
  description: 'Enable/disable apps per project',
};

export default async function ProjectAppsPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'apps');
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
