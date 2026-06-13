import AdminSitesHub from '@/components/admin/AdminSitesHub';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Projects',
  description: 'Your sites — open builder, preview, or live',
};

export default function AdminProjectsPage() {
  return <AdminSitesHub showHero />;
}
