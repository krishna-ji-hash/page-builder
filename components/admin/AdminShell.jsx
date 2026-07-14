'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
  ADMIN_PUBLISHING_PATH,
  PROJECT_SECTIONS,
  SETTINGS_SECTIONS,
  adminActivePathOpts,
  adminFlatProjectSectionPath,
  adminProjectSectionPath,
  breadcrumbLabels,
  parseAdminPathname,
  projectSlugFromParsed,
} from '@/lib/admin/adminRoutes';
import { BLOG_NAV_ITEMS, adminBlogPath } from '@/lib/admin/blogAdminRoutes';
import { projectSidebarLabel } from '@/lib/admin/projectWorkspaceMeta';
import { ACTIVE_PROJECT_CHANGED } from '@/lib/admin/activeProjectEvents';
import { PROJECT_LIST_CHANGED } from '@/lib/admin/projectListEvents';
import { NAV_ICONS, SETTINGS_ICON, workspaceIcon } from '@/lib/admin/navIcons';
import AdminTopbarTools from '@/components/admin/AdminTopbarTools';
import AdminChangePasswordModal from '@/components/admin/AdminChangePasswordModal';
import { readAdminTheme, persistAdminTheme } from '@/lib/admin/adminTheme';
import '@/styles/admin/shell.css';

const MAX_SIDEBAR_PROJECTS = 4;
const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

function readSidebarCollapsed() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

const SIDEBAR_COLLAPSE_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M7.5 4.5H15M7.5 4.5v11M7.5 4.5L5 7M7.5 15.5L5 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="3.5" y="4.5" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const SIDEBAR_EXPAND_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M12.5 4.5H5M12.5 4.5v11M12.5 4.5L15 7M12.5 15.5L15 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="12.5" y="4.5" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function NavItem({ href, active, icon, children, collapsed }) {
  const label = typeof children === 'string' ? children : '';
  return (
    <li className="admin-shell__nav-item">
      <Link
        href={href}
        className={`admin-shell__nav-link${active ? ' is-active' : ''}`}
        data-tooltip={collapsed && label ? label : undefined}
      >
        <span className="admin-shell__nav-icon">{icon}</span>
        <span className="admin-shell__nav-text">{children}</span>
      </Link>
    </li>
  );
}

function isActiveProject(parsed, project, activeProjectId) {
  if (parsed.kind === 'active-project') {
    return activeProjectId != null && Number(project.id) === Number(activeProjectId);
  }
  if (parsed.kind !== 'project') return false;
  if (parsed.projectSlug && project.slug === parsed.projectSlug) return true;
  if (parsed.projectId && Number(project.id) === Number(parsed.projectId)) return true;
  return false;
}

function workspaceSectionHref(section, parsed, projects, activePathOpts) {
  if (parsed.kind === 'active-project') {
    return adminFlatProjectSectionPath(section);
  }
  const slug = projectSlugFromParsed(parsed, projects) || parsed.projectSlug || parsed.projectKey || '';
  const project = projects.find(
    (p) => p.slug === slug || (parsed.projectId && Number(p.id) === Number(parsed.projectId))
  );
  if (
    project &&
    activePathOpts?.activeProjectId != null &&
    Number(project.id) === Number(activePathOpts.activeProjectId)
  ) {
    return adminFlatProjectSectionPath(section);
  }
  return adminProjectSectionPath(slug || project, section, activePathOpts);
}

function BlogNavDropdown({ parsed, projects, sidebarCollapsed, activePathOpts }) {
  const blogActive = parsed.section === 'blog';
  const [open, setOpen] = useState(blogActive);

  useEffect(() => {
    if (blogActive) setOpen(true);
  }, [blogActive]);

  useEffect(() => {
    if (sidebarCollapsed) setOpen(false);
  }, [sidebarCollapsed]);

  const projectRef =
    parsed.kind === 'active-project'
      ? { id: activePathOpts?.activeProjectId, slug: activePathOpts?.activeProjectSlug }
      : {
          slug: projectSlugFromParsed(parsed, projects) || parsed.projectSlug || parsed.projectKey,
          id: parsed.projectId,
        };

  function hrefFor(item) {
    return adminBlogPath(projectRef, item.path, {
      id: activePathOpts?.activeProjectId,
      slug: activePathOpts?.activeProjectSlug,
    });
  }

  function itemActive(item) {
    const sub = String(parsed.blogSub || '');
    if (item.id === 'posts') return blogActive && (!sub || sub === 'posts');
    if (item.id === 'edit') return false;
    if (item.id === 'new') return sub === 'new';
    return sub === item.path || sub.startsWith(`${item.path}/`);
  }

  return (
    <li
      className={`admin-shell__nav-item admin-shell__nav-item--dropdown${open ? ' is-open' : ''}${
        sidebarCollapsed ? ' is-collapsed-sidebar' : ''
      }`}
    >
      <button
        type="button"
        className={`admin-shell__nav-link admin-shell__nav-toggle${blogActive ? ' is-active' : ''}`}
        aria-expanded={open}
        data-tooltip={sidebarCollapsed ? 'Blog' : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-shell__nav-leading">
          <span className="admin-shell__nav-icon">{workspaceIcon('blog')}</span>
          <span className="admin-shell__nav-text">Blog</span>
        </span>
        <svg className="admin-shell__chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
      <div className={`admin-shell__subnav-wrap${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <ul className="admin-shell__subnav" id="admin-blog-subnav">
          {BLOG_NAV_ITEMS.map((item) => (
            <li key={item.id} className="admin-shell__subnav-item">
              <Link
                href={hrefFor(item)}
                className={`admin-shell__subnav-link${itemActive(item) ? ' is-active' : ''}`}
              >
                <span className="admin-shell__subnav-dot" aria-hidden="true" />
                <span className="admin-shell__subnav-name">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function ProjectsNavDropdown({ parsed, projects, sidebarCollapsed, activeProjectId, activePathOpts }) {
  const isProjectsArea =
    parsed.kind === 'projects' ||
    parsed.kind === 'project-new' ||
    parsed.kind === 'project' ||
    parsed.kind === 'active-project';

  const [open, setOpen] = useState(isProjectsArea);
  const toggleRef = useRef(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  useEffect(() => {
    if (isProjectsArea) setOpen(true);
  }, [isProjectsArea]);

  useEffect(() => {
    if (sidebarCollapsed) setOpen(false);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!open || !sidebarCollapsed) return undefined;
    function syncFlyoutTop() {
      const rect = toggleRef.current?.getBoundingClientRect();
      if (rect) setFlyoutTop(rect.top);
    }
    syncFlyoutTop();
    window.addEventListener('resize', syncFlyoutTop);
    window.addEventListener('scroll', syncFlyoutTop, true);
    return () => {
      window.removeEventListener('resize', syncFlyoutTop);
      window.removeEventListener('scroll', syncFlyoutTop, true);
    };
  }, [open, sidebarCollapsed]);

  useEffect(() => {
    if (!open || !sidebarCollapsed) return undefined;
    function onDocClick(e) {
      if (!e.target.closest('.admin-shell__nav-item--dropdown')) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open, sidebarCollapsed]);

  useEffect(() => {
    if (!open || !sidebarCollapsed) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, sidebarCollapsed]);

  const visibleProjects = projects.slice(0, MAX_SIDEBAR_PROJECTS);
  const moreCount = projects.length - visibleProjects.length;

  function toggleOpen() {
    setOpen((v) => !v);
  }

  return (
    <li
      className={`admin-shell__nav-item admin-shell__nav-item--dropdown${open ? ' is-open' : ''}${
        sidebarCollapsed ? ' is-collapsed-sidebar' : ''
      }`}
    >
      <button
        ref={toggleRef}
        type="button"
        className={`admin-shell__nav-link admin-shell__nav-toggle${isProjectsArea ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-controls="admin-projects-subnav"
        data-tooltip={sidebarCollapsed ? 'Projects' : undefined}
        onClick={toggleOpen}
      >
        <span className="admin-shell__nav-leading">
          <span className="admin-shell__nav-icon">{NAV_ICONS.projects}</span>
          <span className="admin-shell__nav-text">Projects</span>
        </span>
        <svg className="admin-shell__chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={`admin-shell__subnav-wrap${open ? ' is-open' : ''}${sidebarCollapsed ? ' is-flyout' : ''}`}
        aria-hidden={!open}
        style={sidebarCollapsed && open ? { top: `${flyoutTop}px` } : undefined}
      >
        {sidebarCollapsed ? (
          <div className="admin-shell__flyout-head">
            <span className="admin-shell__flyout-title">Projects</span>
            <span className="admin-shell__flyout-meta">{projects.length} total</span>
          </div>
        ) : null}
        <ul id="admin-projects-subnav" className="admin-shell__subnav">
          <li className="admin-shell__subnav-item">
            <Link
              href={ADMIN_PROJECTS_PATH}
              className={`admin-shell__subnav-link${parsed.kind === 'projects' ? ' is-active' : ''}`}
              onClick={() => sidebarCollapsed && setOpen(false)}
            >
              All sites
            </Link>
          </li>
          <li className="admin-shell__subnav-item">
            <Link
              href={ADMIN_PROJECT_NEW_PATH}
              className={`admin-shell__subnav-link admin-shell__subnav-link--accent${parsed.kind === 'project-new' ? ' is-active' : ''}`}
              onClick={() => sidebarCollapsed && setOpen(false)}
            >
              <span className="admin-shell__subnav-plus" aria-hidden="true">+</span>
              New project
            </Link>
          </li>
          {visibleProjects.length ? (
            <li className="admin-shell__subnav-group">
              <span className="admin-shell__subnav-heading">Recent</span>
              <ul className="admin-shell__subnav-nested">
                {visibleProjects.map((project) => (
                  <li key={project.id} className="admin-shell__subnav-item">
                    <Link
                      href={adminProjectSectionPath(project, 'overview', activePathOpts)}
                      className={`admin-shell__subnav-link admin-shell__subnav-link--project${
                        isActiveProject(parsed, project, activeProjectId) ? ' is-active' : ''
                      }`}
                      title={projectSidebarLabel(project, activeProjectId)}
                      onClick={() => sidebarCollapsed && setOpen(false)}
                    >
                      <span className="admin-shell__subnav-dot" aria-hidden="true" />
                      <span className="admin-shell__subnav-name">{projectSidebarLabel(project, activeProjectId)}</span>
                    </Link>
                  </li>
                ))}
                {moreCount > 0 ? (
                  <li className="admin-shell__subnav-item">
                    <Link
                      href={ADMIN_PROJECTS_PATH}
                      className="admin-shell__subnav-link admin-shell__subnav-link--more"
                      onClick={() => sidebarCollapsed && setOpen(false)}
                    >
                      +{moreCount} more
                    </Link>
                  </li>
                ) : null}
              </ul>
            </li>
          ) : null}
        </ul>
      </div>
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

function ProjectSwitcher({ parsed, projects, activeProjectId, activePathOpts }) {
  const router = useRouter();
  if (parsed.kind !== 'project' && parsed.kind !== 'active-project') return null;

  const activeSlug =
    parsed.kind === 'active-project'
      ? projects.find((p) => Number(p.id) === Number(activeProjectId))?.slug || ''
      : projectSlugFromParsed(parsed, projects) || parsed.projectSlug || '';

  return (
    <div className="admin-shell__project-switcher">
      <select
        id="admin-project-switcher"
        aria-label="Switch project"
        value={activeSlug}
        onChange={(e) => {
          const nextSlug = String(e.target.value || '').trim();
          if (!nextSlug) return;
          router.push(
            adminProjectSectionPath(nextSlug, parsed.section || 'overview', activePathOpts)
          );
        }}
      >
        {(projects || []).map((p) => (
          <option key={p.id} value={p.slug}>
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
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      /* redirect to login even when the request fails */
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
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
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const parsed = useMemo(() => parseAdminPathname(pathname), [pathname]);
  const crumbs = useMemo(
    () => breadcrumbLabels(parsed, projects, { activeProjectId }),
    [parsed, projects, activeProjectId]
  );

  const activeProjectSlug = useMemo(
    () => projects.find((p) => Number(p.id) === Number(activeProjectId))?.slug || null,
    [projects, activeProjectId]
  );

  const activePathOpts = useMemo(
    () => adminActivePathOpts({ id: activeProjectId, slug: activeProjectSlug }),
    [activeProjectId, activeProjectSlug]
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const pageTitle = crumbs[crumbs.length - 1]?.label || 'Admin';

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsed());
    setTheme(readAdminTheme());
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistAdminTheme(next);
      return next;
    });
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }

  useEffect(() => {
    function loadProjects() {
      fetch('/api/projects', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .then((data) => setProjects(Array.isArray(data?.projects) ? data.projects : []))
        .catch(() => setProjects([]));
    }
    loadProjects();
    window.addEventListener(PROJECT_LIST_CHANGED, loadProjects);
    return () => window.removeEventListener(PROJECT_LIST_CHANGED, loadProjects);
  }, []);

  const sidebarProjects = useMemo(
    () => projects.filter((p) => p.status !== 'ARCHIVED'),
    [projects]
  );

  useEffect(() => {
    function loadActiveProject() {
      fetch('/api/platform/site-settings', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : {}))
        .then((data) => setActiveProjectId(data?.settings?.activeProjectId ?? null))
        .catch(() => setActiveProjectId(null));
    }
    loadActiveProject();
    const onChanged = () => loadActiveProject();
    window.addEventListener(ACTIVE_PROJECT_CHANGED, onChanged);
    return () => window.removeEventListener(ACTIVE_PROJECT_CHANGED, onChanged);
  }, []);

  const isProjectRoute = parsed.kind === 'project' || parsed.kind === 'active-project';

  return (
    <div
      className="admin-shell"
      data-admin-theme={theme}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
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
              <NavItem
                href={ADMIN_DASHBOARD_PATH}
                active={parsed.kind === 'dashboard'}
                icon={NAV_ICONS.dashboard}
                collapsed={sidebarCollapsed}
              >
                Dashboard
              </NavItem>
              <ProjectsNavDropdown
                parsed={parsed}
                projects={sidebarProjects}
                sidebarCollapsed={sidebarCollapsed}
                activeProjectId={activeProjectId}
                activePathOpts={activePathOpts}
              />
              <NavItem
                href={ADMIN_PUBLISHING_PATH}
                active={parsed.kind === 'publishing'}
                icon={NAV_ICONS.publishing}
                collapsed={sidebarCollapsed}
              >
                Publishing
              </NavItem>
              <NavItem
                href={ADMIN_PLATFORM_HEALTH_PATH}
                active={parsed.kind === 'platform-health'}
                icon={NAV_ICONS.health}
                collapsed={sidebarCollapsed}
              >
                Platform health
              </NavItem>
            </NavSection>

            {isProjectRoute ? (
              <NavSection label="Workspace">
                {PROJECT_SECTIONS.map((section) =>
                  section.id === 'blog' ? (
                    <BlogNavDropdown
                      key={section.id}
                      parsed={parsed}
                      projects={projects}
                      sidebarCollapsed={sidebarCollapsed}
                      activePathOpts={activePathOpts}
                    />
                  ) : (
                    <NavItem
                      key={section.id}
                      href={workspaceSectionHref(section.id, parsed, projects, activePathOpts)}
                      active={
                        parsed.kind === 'active-project'
                          ? parsed.section === section.id
                          : parsed.section === section.id
                      }
                      icon={workspaceIcon(section.id)}
                      collapsed={sidebarCollapsed}
                    >
                      {section.label}
                    </NavItem>
                  )
                )}
              </NavSection>
            ) : null}

            <NavSection label="Settings">
              {SETTINGS_SECTIONS.map((section) => (
                <NavItem
                  key={section.id}
                  href={section.href}
                  active={parsed.kind === 'settings' && parsed.section === section.id}
                  icon={SETTINGS_ICON[section.id] || NAV_ICONS.system}
                  collapsed={sidebarCollapsed}
                >
                  {section.label}
                </NavItem>
              ))}
            </NavSection>
          </ul>
        </nav>

        <div className="admin-shell__sidebar-foot">
          <button
            type="button"
            className="admin-shell__sidebar-collapse-btn"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            data-tooltip={sidebarCollapsed ? 'Expand sidebar' : undefined}
          >
            <span className="admin-shell__sidebar-collapse-icon">
              {sidebarCollapsed ? SIDEBAR_EXPAND_ICON : SIDEBAR_COLLAPSE_ICON}
            </span>
            <span className="admin-shell__sidebar-collapse-label">
              {sidebarCollapsed ? 'Expand' : 'Collapse'}
            </span>
          </button>
        </div>
      </aside>

      <div className="admin-shell__main">
        <header className="admin-shell__topbar">
          <div className="admin-shell__topbar-left">
            {sidebarCollapsed ? (
              <button
                type="button"
                className="admin-shell__topbar-menu-btn"
                onClick={toggleSidebarCollapsed}
                aria-label="Expand sidebar"
              >
                {SIDEBAR_EXPAND_ICON}
              </button>
            ) : null}
            <div className="admin-shell__topbar-title-wrap">
              <h1 className="admin-shell__page-title">{pageTitle}</h1>
              <AdminBreadcrumb crumbs={crumbs} />
            </div>
            <ProjectSwitcher
              parsed={parsed}
              projects={sidebarProjects}
              activeProjectId={activeProjectId}
              activePathOpts={activePathOpts}
            />
          </div>
          <AdminTopbarTools
            projects={projects}
            activeProjectId={activeProjectId}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div className="admin-shell__topbar-right">
            <UserMenu />
          </div>
        </header>
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  );
}
