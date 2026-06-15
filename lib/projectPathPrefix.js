/**
 * Prefix relative site paths with `/${projectSlug}` for multi-tenant published URLs.
 * For the primary public project (flat URLs), paths stay at root: `/home`, `/about-us`.
 * Leaves http(s), protocol-relative, /api, and already-prefixed paths unchanged.
 *
 * Hash anchors (`#section`) resolve against the site home path when the visitor is on
 * another page so global header section links keep working on inner routes.
 */

import { getPublicProjectSlug, isFlatPublicUrlsEnabled, publicPagePath } from './publicSiteUrls.js';

function normPathSegment(s) {
  return (s || '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
}

function resolveSiteHomePath(projectSlug) {
  return publicPagePath(projectSlug, 'home');
}

/**
 * @param {string} rawPath
 * @param {string} projectSlug
 * @param {{ currentPath?: string }} [opts]
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
    const homePath = resolveSiteHomePath(slug);
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
  const useFlat = isFlatPublicUrlsEnabled() && slug === getPublicProjectSlug();

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
 * Deep-clone menu items and prefix `to` / `href` / nested `featured.to`.
 * @param {unknown[]} rawItems
 * @param {string} projectSlug
 * @param {string} [currentPath]
 */
export function prefixMenuItemsWithProjectSlug(rawItems, projectSlug, currentPath = '') {
  if (!projectSlug || !Array.isArray(rawItems)) return rawItems;
  const pathOpts = { currentPath };

  const walk = (list) =>
    list.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      const rawTo = next.to ?? next.href;
      if (typeof rawTo === 'string') {
        const prefixed = prefixRelativeAppPath(rawTo, projectSlug, pathOpts);
        next.to = prefixed;
        if ('href' in next) next.href = prefixed;
      }
      if (Array.isArray(next.children)) next.children = walk(next.children);
      if (next.mega && typeof next.mega === 'object' && next.mega.featured && typeof next.mega.featured === 'object') {
        const ft = next.mega.featured.to;
        if (typeof ft === 'string') {
          next.mega = {
            ...next.mega,
            featured: {
              ...next.mega.featured,
              to: prefixRelativeAppPath(ft, projectSlug, pathOpts),
            },
          };
        }
      }
      if (next.featured && typeof next.featured === 'object') {
        const ft = next.featured.to;
        if (typeof ft === 'string') {
          next.featured = {
            ...next.featured,
            to: prefixRelativeAppPath(ft, projectSlug, pathOpts),
          };
        }
      }
      return next;
    });

  return walk(rawItems);
}
