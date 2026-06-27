import { Inter } from 'next/font/google';
import DShell from '@/components/admin/d/DShell';
import { requireAdminPageSession } from '@/lib/auth/requireAdminPageSession';
import '@/styles/admin/light-theme.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export default async function DLayout({ children }) {
  await requireAdminPageSession();

  return (
    <div className={`admin-root ${inter.className}`}>
      <DShell>{children}</DShell>
    </div>
  );
}
