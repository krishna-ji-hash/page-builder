'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { D_PROJECT_NEW_PATH, D_PROJECTS_PATH } from '@/lib/admin/dProjectRoutes';
import '@/styles/admin/d-shell.css';

function isFullscreenDPath(pathname) {
  return (
    pathname?.startsWith('/d/builder/') ||
    pathname?.startsWith('/d/preview/')
  );
}

export default function DShell({ children }) {
  const pathname = usePathname();

  if (isFullscreenDPath(pathname)) {
    return children;
  }

  return (
    <div className="d-shell">
      <header className="d-shell__header">
        <div className="d-shell__brand">
          <Link href={D_PROJECTS_PATH} className="d-shell__logo">
            Builder
          </Link>
          <span className="d-shell__tag">Project manager</span>
        </div>
        <nav className="d-shell__nav" aria-label="Project manager">
          <Link
            href={D_PROJECTS_PATH}
            className={`d-shell__nav-link${pathname === D_PROJECTS_PATH ? ' is-active' : ''}`}
          >
            Projects
          </Link>
          <Link
            href={D_PROJECT_NEW_PATH}
            className={`d-shell__nav-link${pathname === D_PROJECT_NEW_PATH ? ' is-active' : ''}`}
          >
            New project
          </Link>
          <Link href="/admin/dashboard" className="d-shell__nav-link d-shell__nav-link--muted">
            Admin console
          </Link>
        </nav>
      </header>
      <main className="d-shell__main">{children}</main>
    </div>
  );
}
