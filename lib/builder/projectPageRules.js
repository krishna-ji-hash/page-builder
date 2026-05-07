export function normalizeBuilderSlug(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isDuplicatePageSlugInProject(pages, projectId, slug, selfPageId = null) {
  const pid = Number(projectId);
  const normalizedSlug = normalizeBuilderSlug(slug);
  return (pages || []).some((p) => {
    const sameProject = Number(p.project_id ?? p.projectId) === pid;
    const sameSlug = normalizeBuilderSlug(p.slug) === normalizedSlug;
    const samePage = selfPageId != null && Number(p.id) === Number(selfPageId);
    return sameProject && sameSlug && !samePage;
  });
}

export function canDeleteProjectPage(totalPagesInProject) {
  return Number(totalPagesInProject) > 1;
}

export function isLivePagePublished(pageRow) {
  return Boolean(pageRow && pageRow.published_version_id);
}

