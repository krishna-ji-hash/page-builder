import DProjectMedia from '@/components/admin/d/DProjectMedia';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project media | Builder',
};

export default async function DProjectMediaRoute({ params }) {
  const { projectId } = await params;
  return <DProjectMedia projectId={projectId} />;
}
