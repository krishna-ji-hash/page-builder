import { publicPagePath } from '../publicSiteUrls.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function normalizeNavLabel(value) {
  return str(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Common nav labels → page slug (Dispatch / logistics sites). */
export const NAV_LABEL_SLUGS = Object.freeze({
  home: 'home',
  pricing: 'pricing',
  'about us': 'about-us',
  about: 'about-us',
  company: 'about-us',
  contact: 'contact',
  'contact us': 'contact',
  product: 'home',
  products: 'home',
  solutions: 'home',
  shipping: 'bulk-shipping',
  'bulk shipping': 'bulk-shipping',
  logistics: 'home',
  courier: 'home',
  tracking: 'home',
  blog: 'blog',
  docs: 'home',
  documentation: 'home',
  privacy: 'privacy',
  'privacy policy': 'privacy',
  terms: 'terms',
  'terms of service': 'terms',
  'sign up': 'home',
  signup: 'home',
  'get started': 'home',
  'start shipping': 'home',
  'start free': 'home',
  'book demo': 'contact',
  'learn more': 'home',
  'view all': 'blog',
  'read more': 'blog',
});

export function isPlaceholderNavHref(href) {
  const s = str(href).trim();
  return !s || s === '#';
}

/**
 * Resolve `#` menu/button links from label + known project pages.
 * @param {string} label
 * @param {string} projectSlug
 * @param {string[]} [knownPageSlugs]
 */
export function resolvePlaceholderNavHref(label, projectSlug, knownPageSlugs = []) {
  const norm = normalizeNavLabel(label);
  if (!norm || !projectSlug) return '';

  let slug = NAV_LABEL_SLUGS[norm];
  if (!slug && knownPageSlugs.length) {
    const slugSet = new Set(knownPageSlugs.map((s) => str(s).toLowerCase()));
    if (slugSet.has(norm.replace(/\s+/g, '-'))) {
      slug = norm.replace(/\s+/g, '-');
    } else {
      const match = knownPageSlugs.find((s) => {
        const slugNorm = normalizeNavLabel(s.replace(/[-_]+/g, ' '));
        const titleNorm = normalizeNavLabel(s);
        return slugNorm === norm || titleNorm === norm;
      });
      if (match) slug = match;
    }
  }

  if (!slug) return '';
  return publicPagePath(projectSlug, slug);
}
