function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function resolveSiteOrigin(projectSeo = {}) {
  const domain = str(projectSeo?.canonicalDomain || projectSeo?.canonical_domain).trim().replace(/\/+$/, '');
  if (domain) return domain;
  const site = str(process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  return site;
}

/**
 * Turn a path or partial URL into an absolute URL when site origin is known.
 * Returns relative path unchanged if no origin is configured.
 */
export function ensureAbsoluteUrl(originOrDomain, pathOrUrl) {
  const v = str(pathOrUrl).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const origin = str(originOrDomain).trim().replace(/\/+$/, '');
  if (!origin) return v.startsWith('/') ? v : `/${v}`;
  const path = v.startsWith('/') ? v : `/${v}`;
  return `${origin}${path}`;
}
