import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectPublishing from '@/components/admin/workspace/AdminProjectPublishing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project publishing',
};

export default async function ProjectPublishingPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'publishing');
  return <AdminProjectPublishing projectId={projectId} />;
}
