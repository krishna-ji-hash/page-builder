/**
 * Public (live) URL shape for the primary site project.
 * Builder/admin URLs stay `/admin/builder/{projectSlug}/{pageSlug}`.
 *
 * Set `NEXT_PUBLIC_PUBLIC_PROJECT_SLUG=dispatch` (default: dispatch).
 * Set `NEXT_PUBLIC_FLAT_PUBLIC_URLS=false` to restore `/{project}/{page}` live URLs.
 */

const RESERVED_ROOT_SEGMENTS = new Set([
  'admin',
  'api',
  'preview',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

/** Segments that must never be treated as `[projectSlug]` in public project routes. */
export function isReservedProjectSlugSegment(projectSlug) {
  const slug = String(projectSlug || '').trim().toLowerCase();
  return Boolean(slug && RESERVED_ROOT_SEGMENTS.has(slug));
}

export function getPublicProjectSlug() {
  const raw = String(
    process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG || process.env.PUBLIC_PROJECT_SLUG || 'dispatch'
  )
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return raw || 'dispatch';
}

export function isFlatPublicUrlsEnabled() {
  const v = process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
  if (v === '0' || v === 'false') return false;
  return true;
}

/** Flat `/page` paths for live site, builder preview, and custom domains. */
export function shouldUseFlatPublicPaths(projectSlug, opts = {}) {
  if (!isFlatPublicUrlsEnabled()) return false;
  if (opts.publicSite === true) return true;
  const ps = String(projectSlug || '').trim();
  return ps && ps === getPublicProjectSlug();
}

/** @param {string} pageSlug */
export function isRootPublicPageSlug(pageSlug) {
  if (!pageSlug || typeof pageSlug !== 'string') return false;
  const seg = pageSlug.trim().replace(/^\/+|\/+$/g, '');
  if (!seg || seg.includes('/')) return false;
  if (RESERVED_ROOT_SEGMENTS.has(seg.toLowerCase())) return false;
  // Avoid treating the project slug as a page (e.g. /dispatch → use /home instead).
  if (seg.toLowerCase() === getPublicProjectSlug().toLowerCase()) return false;
  return true;
}

/**
 * Live URL path for a page (no origin).
 * @param {string} projectSlug
 * @param {string} pageSlug
 * @param {{ publicSite?: boolean }} [opts]
 */
export function publicPagePath(projectSlug, pageSlug, opts = {}) {
  const ps = String(projectSlug || '').trim();
  const pg = String(pageSlug || '').trim();
  if (!ps || !pg) return '/';
  if (shouldUseFlatPublicPaths(ps, opts)) {
    return `/${pg}`;
  }
  return `/${ps}/${pg}`;
}

/**
 * SEO canonical + internal links for published tree.
 * @param {string} projectSlug
 * @param {string} pageSlug
 */
export function publicPagePathForSeo(projectSlug, pageSlug) {
  return publicPagePath(projectSlug, pageSlug, { publicSite: true });
}

/**
 * Whether `/{segment}` should be handled by `app/[pageSlug]/page.jsx`.
 * @param {string} segment
 */
export function shouldServeFlatPublicPage(segment) {
  if (!isRootPublicPageSlug(segment)) return false;
  return isFlatPublicUrlsEnabled();
}
