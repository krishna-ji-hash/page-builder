import { Inter } from 'next/font/google';
import AdminShell from '@/components/admin/AdminShell';
import '@/styles/admin/shell.css';
import '@/styles/admin/dark-theme.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-admin',
});

export default function AdminWorkspaceLayout({ children }) {
  return (
    <div className={`admin-root ${inter.className}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
