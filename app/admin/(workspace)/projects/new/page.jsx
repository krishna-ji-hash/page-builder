import AdminProjectNew from '@/components/admin/workspace/AdminProjectNew';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'New project',
  description: 'Create a new empty project and open the builder',
};

export default function AdminProjectNewPage() {
  return <AdminProjectNew />;
}
