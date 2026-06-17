import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectCms from '@/components/admin/workspace/AdminProjectCms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'CMS Collections',
  description: 'Manage CMS collections and items',
};

export default async function ProjectCmsPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'cms');
  return <AdminProjectCms projectId={projectId} />;
}
