import AdminStubPage from '@/components/admin/workspace/AdminStubPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Users',
};

export default function AdminSettingsUsersPage() {
  return (
    <AdminStubPage
      title="Users"
      description="Manage admin users, invitations, and workspace access."
      phase="a later phase"
      features={[
        { icon: 'U', title: 'Team members', text: 'Add editors and admins with email invitations.' },
        { icon: 'K', title: 'Access keys', text: 'Session management and forced sign-out.' },
        { icon: 'P', title: 'Project scope', text: 'Limit users to specific projects or roles.' },
        { icon: 'A', title: 'Activity audit', text: 'See who changed what — already live under System.' },
      ]}
    />
  );
}
