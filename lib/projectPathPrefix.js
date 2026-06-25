/**
 * Prefix relative site paths with `/${projectSlug}` for multi-tenant published URLs.
 * For the primary public project (flat URLs), paths stay at root: `/home`, `/about-us`.
 * Leaves http(s), protocol-relative, /api, and already-prefixed paths unchanged.
 *
 * Hash anchors (`#section`) resolve against the site home path when the visitor is on
 * another page so global header section links keep working on inner routes.
 */

import { publicPagePath, shouldUseFlatPublicPaths } from './publicSiteUrls.js';
import { isPlaceholderNavHref, resolvePlaceholderNavHref } from './seo/navLinkResolver.js';

function normPathSegment(s) {
  return (s || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
}

function resolveSiteHomePath(projectSlug, opts = {}) {
  return publicPagePath(projectSlug, 'home', opts);
}

/**
 * @param {string} rawPath
 * @param {string} projectSlug
 * @param {{ currentPath?: string; publicSite?: boolean }} [opts]
 */
export function prefixRelativeAppPath(rawPath, projectSlug, opts = {}) {
  if (!projectSlug || typeof rawPath !== 'string') return rawPath;
  const t = rawPath.trim();
  if (!t || t === '#') return rawPath;
  if (t.startsWith('http://') || t.startsWith('https://')) return rawPath;
  if (t.startsWith('//')) return rawPath;

  const slug = String(projectSlug)
    .trim()
    .replace(/^\/+|\/+$/g, '');
  if (!slug) return rawPath;

  if (t.startsWith('#')) {
    const currentPath = typeof opts.currentPath === 'string' ? opts.currentPath : '';
    const homePath = resolveSiteHomePath(slug, opts);
    if (currentPath && normPathSegment(currentPath) !== normPathSegment(homePath)) {
      return `${homePath}${t}`;
    }
    return t;
  }

  let path = t;
  if (!path.startsWith('/')) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(path)) return rawPath;
    path = `/${path}`;
  }

  if (path.startsWith('/api')) return rawPath;

  const base = `/${slug}`;
  const useFlat = shouldUseFlatPublicPaths(slug, opts);

  if (useFlat) {
    if (path === '/') return '/home';
    if (path === base) return '/home';
    if (path.startsWith(`${base}/`)) {
      const rest = path.slice(base.length);
      return rest || '/home';
    }
    return path;
  }

  if (path.startsWith(`${base}/`) || path === base) return path;
  if (path === '/') return `${base}/home`;
  return `${base}${path}`;
}

/**
 * Nav/button href for live site — unwraps stored absolute localhost URLs and applies flat paths.
 * @param {string} rawPath
 * @param {string} projectSlug
 * @param {{ currentPath?: string; publicSite?: boolean }} [opts]
 */
export function normalizePublicSiteHref(rawPath, projectSlug, opts = {}) {
  if (!projectSlug || typeof rawPath !== 'string') return rawPath;
  const t = rawPath.trim();
  if (!t || t === '#') return rawPath;

  if (t.startsWith('http://') || t.startsWith('https://')) {
    try {
      const { pathname, search, hash } = new URL(t);
      const relative = `${pathname || '/'}${search || ''}${hash || ''}`;
      return prefixRelativeAppPath(relative, projectSlug, opts);
    } catch {
      return rawPath;
    }
  }

  return prefixRelativeAppPath(t, projectSlug, opts);
}

/**
 * Deep-clone menu items and prefix `to` / `href` / nested `featured.to`.
 * @param {unknown[]} rawItems
 * @param {string} projectSlug
 * @param {string} [currentPath]
 * @param {string[]} [knownPageSlugs]
 */
export function prefixMenuItemsWithProjectSlug(rawItems, projectSlug, currentPath = '', knownPageSlugs = [], opts = {}) {
  if (!projectSlug || !Array.isArray(rawItems)) return rawItems;
  const pathOpts = { currentPath, publicSite: opts.publicSite === true };

  const walk = (list) =>
    list.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      let rawTo = next.to ?? next.href;
      if (isPlaceholderNavHref(rawTo)) {
        const resolved = resolvePlaceholderNavHref(next.label, projectSlug, knownPageSlugs);
        if (resolved) rawTo = resolved;
      }
      if (typeof rawTo === 'string') {
        const prefixed = normalizePublicSiteHref(rawTo, projectSlug, pathOpts);
        next.to = prefixed;
        if ('href' in next) next.href = prefixed;
      }
      if (Array.isArray(next.children)) next.children = walk(next.children);
      if (next.mega && typeof next.mega === 'object' && next.mega.featured && typeof next.mega.featured === 'object') {
        let ft = next.mega.featured.to;
        if (isPlaceholderNavHref(ft)) {
          const resolved = resolvePlaceholderNavHref(next.mega.featured.label, projectSlug, knownPageSlugs);
          if (resolved) ft = resolved;
        }
        if (typeof ft === 'string') {
          next.mega = {
            ...next.mega,
            featured: {
              ...next.mega.featured,
              to: normalizePublicSiteHref(ft, projectSlug, pathOpts),
            },
          };
        }
      }
      if (next.featured && typeof next.featured === 'object') {
        const ft = next.featured.to;
        if (typeof ft === 'string') {
          next.featured = {
            ...next.featured,
            to: normalizePublicSiteHref(ft, projectSlug, pathOpts),
          };
        }
      }
      return next;
    });

  return walk(rawItems);
}
