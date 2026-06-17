import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectPages from '@/components/admin/workspace/AdminProjectPages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project pages',
};

export default async function ProjectPagesPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'pages');
  return <AdminProjectPages projectId={projectId} />;
}
