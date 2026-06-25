import DProjectsList from '@/components/admin/d/DProjectsList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projects',
  description: 'Manage sites, domains, and published pages',
};

export default function AdminProjectsPage() {
  return <DProjectsList />;
}
