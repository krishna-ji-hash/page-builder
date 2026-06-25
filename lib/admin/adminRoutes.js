/** Admin workspace route helpers — no builder imports. */

export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

/** Safe post-login target from `?next=` (decoded); falls back to dashboard. */
export function resolveAdminLoginRedirectTarget(nextParam) {
  const fallback = ADMIN_DASHBOARD_PATH;
  const raw = typeof nextParam === 'string' ? nextParam.trim() : '';
  if (!raw) return fallback;

  try {
    const path = decodeURIComponent(raw);
    if (!path.startsWith('/') || path.startsWith('//')) return fallback;

    const base = path.split('?')[0].split('#')[0];
    if (base === ADMIN_LOGIN_PATH) return fallback;
    if (!base.startsWith('/admin')) return fallback;

    return path;
  } catch {
    return fallback;
  }
}
export const ADMIN_PROJECTS_PATH = '/admin/projects';
export const ADMIN_PROJECT_NEW_PATH = '/admin/projects/new';
export const ADMIN_PUBLISHING_PATH = '/admin/publishing';
export const ADMIN_PLATFORM_HEALTH_PATH = '/admin/platform-health';
export const ADMIN_BUILDER_PATH = '/admin/builder';

export const PROJECT_SECTIONS = Object.freeze([
  { id: 'overview', label: 'Overview' },
  { id: 'pages', label: 'Pages' },
  { id: 'cms', label: 'CMS' },
  { id: 'blog', label: 'Blog' },
  { id: 'forms', label: 'Forms' },
  { id: 'seo', label: 'SEO' },
  { id: 'domains', label: 'Domains' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'media', label: 'Media' },
  { id: 'menus', label: 'Menus' },
  { id: 'theme', label: 'Theme' },
  { id: 'settings', label: 'Settings' },
  { id: 'apps', label: 'Apps' },
]);

export const SETTINGS_SECTIONS = Object.freeze([
  { id: 'users', label: 'Users', href: '/admin/settings/users' },
  { id: 'roles', label: 'Roles', href: '/admin/settings/roles' },
  { id: 'system', label: 'System', href: '/admin/settings/system' },
]);

export const PROJECT_SECTION_IDS = new Set(
  PROJECT_SECTIONS.map((s) => s.id)
);

/** Active/default project workspace — `/admin/projects/pages` (no slug in URL). */
export function adminFlatProjectSectionPath(section) {
  const sec = String(section || 'overview').trim() || 'overview';
  return `/admin/projects/${sec}`;
}

function resolveProjectRef(projectRef) {
  if (projectRef != null && typeof projectRef === 'object') {
    return {
      slug: String(projectRef.slug ?? '').trim(),
      id: projectRef.id != null ? Number(projectRef.id) : null,
    };
  }
  const raw = String(projectRef ?? '').trim();
  if (raw && /^\d+$/.test(raw)) return { slug: '', id: Number(raw) };
  return { slug: raw, id: null };
}

export function adminProjectSectionPath(projectRef, section, opts = {}) {
  const { slug, id } = resolveProjectRef(projectRef);
  const sec = String(section || 'overview').trim() || 'overview';
  const activeId =
    opts.activeProjectId != null && Number.isFinite(Number(opts.activeProjectId))
      ? Number(opts.activeProjectId)
      : null;
  const activeSlug =
    opts.activeProjectSlug != null ? String(opts.activeProjectSlug).trim() : '';

  if (activeId && id && id === activeId) {
    return adminFlatProjectSectionPath(sec);
  }
  if (activeId && projectRef?.id != null && Number(projectRef.id) === activeId) {
    return adminFlatProjectSectionPath(sec);
  }
  if (activeSlug && slug && slug === activeSlug) {
    return adminFlatProjectSectionPath(sec);
  }

  if (!slug) return ADMIN_PROJECTS_PATH;
  return `/admin/projects/${encodeURIComponent(slug)}/${sec}`;
}

/** Pages workspace with add form focused (hash scroll). */
export function adminProjectPagesAddPath(projectRef, activeProject) {
  return `${adminProjectSectionPath(projectRef, 'pages', adminActivePathOpts(activeProject))}#add-page`;
}

/** Link opts so active/default project uses flat `/admin/projects/:section` URLs. */
export function adminActivePathOpts(activeProject) {
  if (activeProject == null) return {};
  if (typeof activeProject === 'number' || (typeof activeProject === 'string' && /^\d+$/.test(activeProject))) {
    return { activeProjectId: Number(activeProject) };
  }
  const id = activeProject.id ?? activeProject.activeProjectId;
  const slug = activeProject.slug ?? activeProject.activeProjectSlug;
  const opts = {};
  if (id != null && Number.isFinite(Number(id))) opts.activeProjectId = Number(id);
  if (slug) opts.activeProjectSlug = String(slug).trim();
  return opts;
}

function findProjectInList(parsed, projects) {
  if (!Array.isArray(projects) || !projects.length) return null;
  if (parsed.projectSlug) {
    return projects.find((p) => p.slug === parsed.projectSlug) || null;
  }
  if (parsed.projectId) {
    return projects.find((p) => Number(p.id) === Number(parsed.projectId)) || null;
  }
  return null;
}

export function projectLabelFromParsed(parsed, projects) {
  const project = findProjectInList(parsed, projects);
  if (project?.name) return project.name;
  if (project?.slug) return project.slug;
  if (parsed.projectSlug) return parsed.projectSlug;
  if (parsed.projectId) return `Project #${parsed.projectId}`;
  return 'Project';
}

export function projectSlugFromParsed(parsed, projects) {
  const project = findProjectInList(parsed, projects);
  return project?.slug || parsed.projectSlug || '';
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
    if (segments.length === 3 && PROJECT_SECTION_IDS.has(segments[2])) {
      return { kind: 'active-project', section: segments[2], segments };
    }
    const projectKey = segments[2];
    if (projectKey) {
      const isNumeric = /^\d+$/.test(projectKey);
      return {
        kind: 'project',
        projectSlug: isNumeric ? null : decodeURIComponent(projectKey),
        projectId: isNumeric ? Number(projectKey) : null,
        projectKey: decodeURIComponent(projectKey),
        section: segments[3] || 'overview',
        segments,
      };
    }
    return { kind: 'projects', segments };
  }

  return { kind: 'other', segments };
}

export function breadcrumbLabels(parsed, projects = [], opts = {}) {
  const activeProjectId = opts.activeProjectId ?? null;
  const activeProject =
    activeProjectId != null
      ? projects.find((p) => Number(p.id) === Number(activeProjectId)) || null
      : null;
  const activePathOpts = activeProject
    ? { activeProjectId: activeProject.id, activeProjectSlug: activeProject.slug }
    : activeProjectId != null
      ? { activeProjectId }
      : {};

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
  if (parsed.kind === 'active-project') {
    crumbs.push({ label: 'Projects', href: ADMIN_PROJECTS_PATH });
    const name = activeProject?.name || activeProject?.slug || 'Project';
    crumbs.push({
      label: name,
      href: adminFlatProjectSectionPath('overview'),
    });
    const section = PROJECT_SECTIONS.find((s) => s.id === parsed.section);
    if (section && parsed.section !== 'overview') {
      crumbs.push({ label: section.label });
    }
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
    const slug = projectSlugFromParsed(parsed, projects);
    const name = projectLabelFromParsed(parsed, projects);
    crumbs.push({
      label: name,
      href: slug ? adminProjectSectionPath(slug, 'overview', activePathOpts) : ADMIN_PROJECTS_PATH,
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
