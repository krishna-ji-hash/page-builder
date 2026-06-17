import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectTheme from '@/components/admin/workspace/AdminProjectTheme';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Theme',
};

export default async function ProjectThemePage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'theme');
  return <AdminProjectTheme projectId={projectId} />;
}
