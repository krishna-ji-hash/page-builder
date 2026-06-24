import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import DProjectMenus from '@/components/admin/d/DProjectMenus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project menus',
};

export default async function ProjectMenusPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'menus');
  return <DProjectMenus projectId={projectId} />;
}
