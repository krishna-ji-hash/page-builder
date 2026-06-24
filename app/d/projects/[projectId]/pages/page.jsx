import DProjectPages from '@/components/admin/d/DProjectPages';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project pages | Builder',
};

export default async function DProjectPagesRoute({ params }) {
  const { projectId } = await params;
  return <DProjectPages projectId={projectId} />;
}
