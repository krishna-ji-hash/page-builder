import BuilderProjectsManager from '@/components/builder/BuilderProjectsManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builder — Projects',
  description: 'Manage projects and pages for builder',
};

export default async function AdminBuilderIndexPage() {
  return <BuilderProjectsManager />;
}
