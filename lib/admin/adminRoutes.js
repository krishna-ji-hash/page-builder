/** Admin workspace route helpers — no builder imports. */

export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
export const ADMIN_PROJECTS_PATH = '/admin/projects';
export const ADMIN_PROJECT_NEW_PATH = '/admin/projects/new';
export const ADMIN_PUBLISHING_PATH = '/admin/publishing';
export const ADMIN_PLATFORM_HEALTH_PATH = '/admin/platform-health';
export const ADMIN_BUILDER_PATH = '/admin/builder';

export const PROJECT_SECTIONS = Object.freeze([
  { id: 'overview', label: 'Overview' },
  { id: 'pages', label: 'Pages' },
  { id: 'cms', label: 'CMS' },
  { id: 'forms', label: 'Forms' },
  { id: 'seo', label: 'SEO' },
  { id: 'domains', label: 'Domains' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'media', label: 'Media' },
  { id: 'theme', label: 'Theme' },
  { id: 'settings', label: 'Settings' },
]);

export const SETTINGS_SECTIONS = Object.freeze([
  { id: 'users', label: 'Users', href: '/admin/settings/users' },
  { id: 'roles', label: 'Roles', href: '/admin/settings/roles' },
  { id: 'system', label: 'System', href: '/admin/settings/system' },
]);

export function adminProjectSectionPath(projectId, section) {
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return ADMIN_PROJECTS_PATH;
  return `/admin/projects/${id}/${section}`;
}

export function parseAdminPathname(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  if (segments[0] !== 'admin') {
    return { kind: 'other', segments };
  }

  if (segments.length === 1) {
    return { kind: 'admin-root', segments };
  }

  if (segments[1] === 'dashboard') return { kind: 'dashboard', segments };
  if (segments[1] === 'publishing') return { kind: 'publishing', segments };
  if (segments[1] === 'platform-health') return { kind: 'platform-health', segments };
  if (segments[1] === 'builder') return { kind: 'builder', segments };
  if (segments[1] === 'login') return { kind: 'login', segments };

  if (segments[1] === 'settings') {
    return { kind: 'settings', section: segments[2] || null, segments };
  }

  if (segments[1] === 'projects') {
    if (segments[2] === 'new') return { kind: 'project-new', segments };
    const projectId = Number(segments[2]);
    if (Number.isInteger(projectId) && projectId > 0) {
      return {
        kind: 'project',
        projectId,
        section: segments[3] || 'overview',
        segments,
      };
    }
    return { kind: 'projects', segments };
  }

  return { kind: 'other', segments };
}

export function breadcrumbLabels(parsed) {
  const crumbs = [{ label: 'Admin', href: ADMIN_DASHBOARD_PATH }];

  if (parsed.kind === 'dashboard') {
    crumbs.push({ label: 'Dashboard' });
    return crumbs;
  }
  if (parsed.kind === 'projects') {
    crumbs.push({ label: 'Projects' });
    return crumbs;
  }
  if (parsed.kind === 'project-new') {
    crumbs.push({ label: 'Projects', href: ADMIN_PROJECTS_PATH });
    crumbs.push({ label: 'New project' });
    return crumbs;
  }
  if (parsed.kind === 'publishing') {
    crumbs.push({ label: 'Publishing' });
    return crumbs;
  }
  if (parsed.kind === 'platform-health') {
    crumbs.push({ label: 'Platform health' });
    return crumbs;
  }
  if (parsed.kind === 'settings') {
    crumbs.push({ label: 'Settings' });
    const section = SETTINGS_SECTIONS.find((s) => s.id === parsed.section);
    if (section) crumbs.push({ label: section.label });
    return crumbs;
  }
  if (parsed.kind === 'project') {
    crumbs.push({ label: 'Projects', href: ADMIN_PROJECTS_PATH });
    crumbs.push({
      label: `Project #${parsed.projectId}`,
      href: adminProjectSectionPath(parsed.projectId, 'overview'),
    });
    const section = PROJECT_SECTIONS.find((s) => s.id === parsed.section);
    if (section && parsed.section !== 'overview') {
      crumbs.push({ label: section.label });
    } else if (!section && parsed.section) {
      crumbs.push({ label: parsed.section });
    }
    return crumbs;
  }

  return crumbs;
}
