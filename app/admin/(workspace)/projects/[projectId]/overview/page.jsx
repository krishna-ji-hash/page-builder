import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectOverview from '@/components/admin/workspace/AdminProjectOverview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project overview',
};

export default async function ProjectOverviewPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'overview');
  return <AdminProjectOverview projectId={projectId} />;
}
