import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectSettings from '@/components/admin/workspace/AdminProjectSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project settings',
};

export default async function ProjectSettingsPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'settings');
  return <AdminProjectSettings projectId={projectId} />;
}
