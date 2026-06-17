import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectMedia from '@/components/admin/workspace/AdminProjectMedia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Media',
  description: 'Project media library — upload and manage assets',
};

export default async function ProjectMediaPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'media');
  return <AdminProjectMedia projectId={projectId} />;
}
