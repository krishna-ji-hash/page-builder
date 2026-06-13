import AdminStubPage from '@/components/admin/workspace/AdminStubPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Roles',
};

export default function AdminSettingsRolesPage() {
  return (
    <AdminStubPage
      title="Roles & permissions"
      description="super_admin, admin, editor, and viewer role definitions."
      phase="a later phase"
      features={[
        { icon: 'S', title: 'Super admin', text: 'Full platform access — current bootstrap role.' },
        { icon: 'E', title: 'Editor', text: 'Builder, pages, and publish within assigned projects.' },
        { icon: 'V', title: 'Viewer', text: 'Read-only preview and analytics access.' },
        { icon: 'L', title: 'Custom roles', text: 'Per-module permissions for CMS, SEO, and domains.' },
      ]}
    />
  );
}
