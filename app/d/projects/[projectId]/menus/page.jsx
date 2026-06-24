import DProjectMenus from '@/components/admin/d/DProjectMenus';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project menus | Builder',
};

export default async function DProjectMenusRoute({ params }) {
  const { projectId } = await params;
  return <DProjectMenus projectId={projectId} />;
}
