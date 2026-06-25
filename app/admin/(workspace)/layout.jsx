import { Inter } from 'next/font/google';
import AdminShell from '@/components/admin/AdminShell';
import { requireAdminPageSession } from '@/lib/auth/requireAdminPageSession';
import '@/styles/admin/shell.css';
import '@/styles/admin/light-theme.css';
import '@/styles/admin/dark-theme.css';
import '@/styles/admin/workspace-dark.css';
import '@/styles/admin/workspace.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-admin',
});

export const dynamic = 'force-dynamic';

export default async function AdminWorkspaceLayout({ children }) {
  await requireAdminPageSession();

  return (
    <div className={`admin-root ${inter.className}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
