/**
 * Prefix relative site paths with `/${projectSlug}` for multi-tenant published URLs.
 * Leaves http(s), protocol-relative, /api, hashes, and already-prefixed paths unchanged.
 */

export function prefixRelativeAppPath(rawPath, projectSlug) {
  if (!projectSlug || typeof rawPath !== 'string') return rawPath;
  const t = rawPath.trim();
  if (!t || t === '#') return rawPath;
  if (t.startsWith('#')) return rawPath;
  if (t.startsWith('http://') || t.startsWith('https://')) return rawPath;
  if (t.startsWith('//')) return rawPath;
  if (!t.startsWith('/')) return rawPath;
  if (t.startsWith('/api')) return rawPath;

  const slug = String(projectSlug)
    .trim()
    .replace(/^\/+|\/+$/g, '');
  if (!slug) return rawPath;

  const base = `/${slug}`;
  if (t.startsWith(`${base}/`) || t === base) return rawPath;
  if (t === '/') return `${base}/home`;
  return `${base}${t}`;
}

/**
 * Deep-clone menu items and prefix `to` / `href` / nested `featured.to`.
 * @param {unknown[]} rawItems
 * @param {string} projectSlug
 */
export function prefixMenuItemsWithProjectSlug(rawItems, projectSlug) {
  if (!projectSlug || !Array.isArray(rawItems)) return rawItems;

  const walk = (list) =>
    list.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      const rawTo = next.to ?? next.href;
      if (typeof rawTo === 'string') {
        const prefixed = prefixRelativeAppPath(rawTo, projectSlug);
        next.to = prefixed;
        if ('href' in next) next.href = prefixed;
      }
      if (Array.isArray(next.children)) next.children = walk(next.children);
      if (next.featured && typeof next.featured === 'object') {
        const ft = next.featured.to;
        if (typeof ft === 'string') {
          next.featured = {
            ...next.featured,
            to: prefixRelativeAppPath(ft, projectSlug),
          };
        }
      }
      return next;
    });

  return walk(rawItems);
}
