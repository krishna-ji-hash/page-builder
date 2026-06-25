/** Display helpers for unified project workspace UI. */

export function projectWorkspaceInitial(name) {
  const ch = String(name ?? '?').trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

export function isActiveLocalhostProject(project, activeProjectId) {
  return (
    project != null &&
    activeProjectId != null &&
    Number(project.id) === Number(activeProjectId)
  );
}

/**
 * Human-readable meta chips for workspace header (avoids bare slug "d" on localhost default).
 */
export function formatProjectWorkspaceMeta(project, { activeProjectId, primaryDomain } = {}) {
  const chips = [];
  if (isActiveLocalhostProject(project, activeProjectId)) {
    chips.push({ key: 'default', label: 'localhost default' });
  } else if (primaryDomain) {
    chips.push({ key: 'domain', label: primaryDomain });
  } else if (project?.slug) {
    chips.push({ key: 'slug', label: `/${project.slug}` });
  }
  if (project?.type) {
    chips.push({ key: 'type', label: project.type });
  }
  return chips;
}

/** Sidebar / switcher hint when multiple projects share a name. */
export function projectSidebarHint(project, activeProjectId) {
  if (isActiveLocalhostProject(project, activeProjectId)) return 'localhost';
  const domain = project?.primaryDomain || project?.domain;
  if (domain) return domain;
  return project?.slug || '';
}

export function projectSidebarLabel(project, activeProjectId) {
  const name = project?.name || project?.slug || `Project ${project?.id}`;
  const hint = projectSidebarHint(project, activeProjectId);
  if (hint && hint !== name && !name.toLowerCase().includes(String(hint).toLowerCase())) {
    return `${name} · ${hint}`;
  }
  return name;
}
