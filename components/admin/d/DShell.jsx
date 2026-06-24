'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';
import '@/styles/admin/d-shell.css';

function isFullscreenDPath(pathname) {
  return (
    pathname?.startsWith('/d/builder/') ||
    pathname?.startsWith('/d/preview/')
  );
}

/**
 * Minimal chrome for /d/builder and /d/preview only.
 * Project manager lives under /admin/projects.
 */
export default function DShell({ children }) {
  const pathname = usePathname();

  if (isFullscreenDPath(pathname)) {
    return children;
  }

  return (
    <div className="d-shell d-shell--redirect">
      <header className="d-shell__header">
        <div className="d-shell__brand">
          <Link href={ADMIN_PROJECTS_PATH} className="d-shell__logo">
            Admin
          </Link>
          <span className="d-shell__tag">Redirecting to workspace…</span>
        </div>
      </header>
      <main className="d-shell__main">{children}</main>
    </div>
  );
}
