import { Inter } from 'next/font/google';
import DShell from '@/components/admin/d/DShell';
import '@/styles/admin/light-theme.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function DLayout({ children }) {
  return (
    <div className={`admin-root ${inter.className}`}>
      <DShell>{children}</DShell>
    </div>
  );
}
