import { adminActivePathOpts } from '../admin/adminRoutes.js';
import { BLOG_POST_TEMPLATE_SLUG } from '../blogPostTemplatePage.js';

/** Active/default project builder — `/admin/builder/{pageSlug}` (no project slug). */
export function adminFlatBuilderPagePath(pageSlug) {
  const sec = String(pageSlug || '').trim();
  if (!sec) return '/admin/builder';
  return `/admin/builder/${encodeURIComponent(sec)}`;
}

function resolveBuilderProjectRef(projectRef) {
  if (projectRef != null && typeof projectRef === 'object') {
    return {
      slug: String(projectRef.slug ?? projectRef.projectSlug ?? '').trim(),
      id: projectRef.id != null ? Number(projectRef.id) : null,
    };
  }
  const raw = String(projectRef ?? '').trim();
  if (raw && /^\d+$/.test(raw)) return { slug: '', id: Number(raw) };
  return { slug: raw, id: null };
}

function builderPathOpts(active) {
  const opts = adminActivePathOpts(active);
  if (!opts.activeProjectSlug && typeof process !== 'undefined') {
    const envSlug = String(process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG || '').trim();
    if (envSlug) opts.activeProjectSlug = envSlug;
  }
  return opts;
}

/** Admin builder editor URL — flat for active project, else `/admin/builder/{projectSlug}/{pageSlug}`. */
export function adminBuilderPagePath(projectRef, pageSlug, active) {
  const { slug, id } = resolveBuilderProjectRef(projectRef);
  const sec = String(pageSlug || '').trim();
  if (!sec) return '/admin/builder';

  const opts = builderPathOpts(active);
  const activeId =
    opts.activeProjectId != null && Number.isFinite(Number(opts.activeProjectId))
      ? Number(opts.activeProjectId)
      : null;
  const activeSlug = opts.activeProjectSlug != null ? String(opts.activeProjectSlug).trim() : '';

  if (activeId != null && id != null && id === activeId) {
    return adminFlatBuilderPagePath(sec);
  }
  if (activeId != null && projectRef?.id != null && Number(projectRef.id) === activeId) {
    return adminFlatBuilderPagePath(sec);
  }
  if (activeSlug && slug && slug === activeSlug) {
    return adminFlatBuilderPagePath(sec);
  }

  if (!slug) return '/admin/builder';
  return `/admin/builder/${encodeURIComponent(slug)}/${encodeURIComponent(sec)}`;
}

/**
 * Blog article template builder with a CMS post preview injected on canvas.
 * @param {string|{ slug?: string, id?: number }} projectRef
 * @param {string} postSlug
 * @param {object} [active]
 */
export function adminBuilderBlogPostPreviewPath(projectRef, postSlug, active) {
  const base = adminBuilderPagePath(projectRef, BLOG_POST_TEMPLATE_SLUG, active);
  const slug = String(postSlug || '').trim();
  if (!slug) return base;
  const qs = new URLSearchParams({ post: slug });
  return `${base}?${qs.toString()}`;
}

/** Draft preview URL — same slugs as public and builder routes. */
export function previewPagePath(projectSlug, pageSlug, options = null) {
  if (!projectSlug || !pageSlug) return null;
  const base = `/preview/${projectSlug}/${pageSlug}`;
  const versionId = options?.versionId;
  if (versionId != null && versionId !== '' && Number.isInteger(Number(versionId)) && Number(versionId) > 0) {
    return `${base}?versionId=${Number(versionId)}`;
  }
  return base;
}

/** Immutable published-version preview (version history). */
export function previewVersionPath(versionId) {
  const id = Number(versionId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `/preview/version/${id}`;
}
