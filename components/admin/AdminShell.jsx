'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
  ADMIN_PUBLISHING_PATH,
  PROJECT_SECTIONS,
  SETTINGS_SECTIONS,
  adminProjectSectionPath,
  breadcrumbLabels,
  parseAdminPathname,
} from '@/lib/admin/adminRoutes';
import { NAV_ICONS, SETTINGS_ICON, workspaceIcon } from '@/lib/admin/navIcons';
import AdminTopbarTools from '@/components/admin/AdminTopbarTools';
import AdminChangePasswordModal from '@/components/admin/AdminChangePasswordModal';
import '@/styles/admin/shell.css';

const MAX_SIDEBAR_PROJECTS = 4;

function NavItem({ href, active, icon, children }) {
  return (
    <li className="admin-shell__nav-item">
      <Link href={href} className={`admin-shell__nav-link${active ? ' is-active' : ''}`}>
        <span className="admin-shell__nav-icon">{icon}</span>
        <span className="admin-shell__nav-text">{children}</span>
      </Link>
    </li>
  );
}

function ProjectsNavDropdown({ parsed, projects }) {
  const isProjectsArea =
    parsed.kind === 'projects' ||
    parsed.kind === 'project-new' ||
    parsed.kind === 'project';

  const [open, setOpen] = useState(isProjectsArea);

  useEffect(() => {
    if (isProjectsArea) setOpen(true);
  }, [isProjectsArea]);

  const visibleProjects = projects.slice(0, MAX_SIDEBAR_PROJECTS);
  const moreCount = projects.length - visibleProjects.length;

  return (
    <li className={`admin-shell__nav-item admin-shell__nav-item--dropdown${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className={`admin-shell__nav-link admin-shell__nav-toggle${isProjectsArea ? ' is-active' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-shell__nav-leading">
          <span className="admin-shell__nav-icon">{NAV_ICONS.projects}</span>
          <span className="admin-shell__nav-text">Projects</span>
        </span>
        <svg className="admin-shell__chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <ul className="admin-shell__subnav">
          <li className="admin-shell__subnav-item">
            <Link
              href={ADMIN_PROJECTS_PATH}
              className={`admin-shell__subnav-link${parsed.kind === 'projects' ? ' is-active' : ''}`}
            >
              All sites
            </Link>
          </li>
          <li className="admin-shell__subnav-item">
            <Link
              href={ADMIN_PROJECT_NEW_PATH}
              className={`admin-shell__subnav-link admin-shell__subnav-link--accent${parsed.kind === 'project-new' ? ' is-active' : ''}`}
            >
              + New project
            </Link>
          </li>
          {visibleProjects.length ? (
            <li className="admin-shell__subnav-group">
              <span className="admin-shell__subnav-heading">Recent</span>
              <ul className="admin-shell__subnav-nested">
                {visibleProjects.map((project) => (
                  <li key={project.id} className="admin-shell__subnav-item">
                    <Link
                      href={adminProjectSectionPath(project.id, 'overview')}
                      className={`admin-shell__subnav-link admin-shell__subnav-link--project${
                        parsed.kind === 'project' && parsed.projectId === project.id ? ' is-active' : ''
                      }`}
                      title={project.name || project.slug}
                    >
                      <span className="admin-shell__subnav-dot" aria-hidden="true" />
                      <span className="admin-shell__subnav-name">{project.name || project.slug}</span>
                    </Link>
                  </li>
                ))}
                {moreCount > 0 ? (
                  <li className="admin-shell__subnav-item">
                    <Link href={ADMIN_PROJECTS_PATH} className="admin-shell__subnav-link admin-shell__subnav-link--more">
                      +{moreCount} more
                    </Link>
                  </li>
                ) : null}
              </ul>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function NavSection({ label, children }) {
  return (
    <li className="admin-shell__nav-section">
      <span className="admin-shell__nav-label">{label}</span>
      <ul className="admin-shell__nav-list">{children}</ul>
    </li>
  );
}

function AdminBreadcrumb({ crumbs }) {
  if (!crumbs?.length) return null;
  return (
    <nav className="admin-shell__breadcrumb" aria-label="Breadcrumb">
      <ol className="admin-shell__breadcrumb-list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="admin-shell__breadcrumb-item">
              {index > 0 ? <span className="admin-shell__breadcrumb-sep" aria-hidden="true">/</span> : null}
              {crumb.href && !isLast ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span className="admin-shell__breadcrumb-current" aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ProjectSwitcher({ parsed, projects }) {
  const router = useRouter();
  if (parsed.kind !== 'project' || !parsed.projectId) return null;

  return (
    <div className="admin-shell__project-switcher">
      <select
        id="admin-project-switcher"
        aria-label="Switch project"
        value={String(parsed.projectId)}
        onChange={(e) => {
          const nextId = Number(e.target.value);
          if (!Number.isInteger(nextId) || nextId <= 0) return;
          router.push(adminProjectSectionPath(nextId, parsed.section || 'overview'));
        }}
      >
        {(projects || []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.slug || `Project ${p.id}`}
          </option>
        ))}
      </select>
    </div>
  );
}

function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (!e.target.closest('.admin-shell__user-menu')) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const label = user?.displayName || user?.email || 'Account';
  const initial = (label[0] || 'A').toUpperCase();

  return (
    <>
      <div className="admin-shell__user-menu">
        <button
          type="button"
          className="admin-shell__user-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="admin-shell__user-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="admin-shell__user-label">{label}</span>
          <svg className="admin-shell__chevron admin-shell__chevron--sm" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
        {open ? (
          <div className="admin-shell__user-dropdown">
            <div className="admin-shell__user-meta">
              <div className="admin-shell__user-meta-name">{label}</div>
              <div>{user?.email || '—'}</div>
              {user?.role ? <div className="admin-shell__user-role">{user.role}</div> : null}
            </div>
            <button
              type="button"
              className="admin-shell__user-action"
              onClick={() => {
                setOpen(false);
                setPasswordOpen(true);
              }}
            >
              Change password
            </button>
            <button type="button" className="admin-shell__user-action admin-shell__user-action--danger" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      <AdminChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const parsed = useMemo(() => parseAdminPathname(pathname), [pathname]);
  const crumbs = useMemo(() => breadcrumbLabels(parsed), [parsed]);
  const [projects, setProjects] = useState([]);
  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Admin';

  useEffect(() => {
    fetch('/api/projects', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((data) => setProjects(Array.isArray(data?.projects) ? data.projects : []))
      .catch(() => setProjects([]));
  }, []);

  const isProjectRoute = parsed.kind === 'project';

  return (
    <div className="admin-shell" data-admin-theme="light">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__sidebar-head">
          <Link href={ADMIN_DASHBOARD_PATH} className="admin-shell__brand">
            <span className="admin-shell__brand-mark" aria-hidden="true">
              B
            </span>
            <span className="admin-shell__brand-text">
              <span className="admin-shell__brand-name">Builder</span>
              <span className="admin-shell__brand-tag">Admin Console</span>
            </span>
          </Link>
        </div>

        <nav className="admin-shell__nav" aria-label="Admin navigation">
          <ul className="admin-shell__nav-sections">
            <NavSection label="Platform">
              <NavItem href={ADMIN_DASHBOARD_PATH} active={parsed.kind === 'dashboard'} icon={NAV_ICONS.dashboard}>
                Dashboard
              </NavItem>
              <ProjectsNavDropdown parsed={parsed} projects={projects} />
              <NavItem href={ADMIN_PUBLISHING_PATH} active={parsed.kind === 'publishing'} icon={NAV_ICONS.publishing}>
                Publishing
              </NavItem>
              <NavItem href={ADMIN_PLATFORM_HEALTH_PATH} active={parsed.kind === 'platform-health'} icon={NAV_ICONS.health}>
                Platform health
              </NavItem>
            </NavSection>

            {isProjectRoute ? (
              <NavSection label="Workspace">
                {PROJECT_SECTIONS.map((section) => (
                  <NavItem
                    key={section.id}
                    href={adminProjectSectionPath(parsed.projectId, section.id)}
                    active={parsed.section === section.id}
                    icon={workspaceIcon(section.id)}
                  >
                    {section.label}
                  </NavItem>
                ))}
              </NavSection>
            ) : null}

            <NavSection label="Settings">
              {SETTINGS_SECTIONS.map((section) => (
                <NavItem
                  key={section.id}
                  href={section.href}
                  active={parsed.kind === 'settings' && parsed.section === section.id}
                  icon={SETTINGS_ICON[section.id] || NAV_ICONS.system}
                >
                  {section.label}
                </NavItem>
              ))}
            </NavSection>
          </ul>
        </nav>
      </aside>

      <div className="admin-shell__main">
        <header className="admin-shell__topbar">
          <div className="admin-shell__topbar-left">
            <div className="admin-shell__topbar-title-wrap">
              <h1 className="admin-shell__page-title">{pageTitle}</h1>
              <AdminBreadcrumb crumbs={crumbs} />
            </div>
            <ProjectSwitcher parsed={parsed} projects={projects} />
          </div>
          <AdminTopbarTools projects={projects} />
          <div className="admin-shell__topbar-right">
            <UserMenu />
          </div>
        </header>
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  );
}
