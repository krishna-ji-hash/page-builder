import AdminDashboard from '@/components/admin/workspace/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
  description: 'Admin platform dashboard',
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
