/**
 * Public URL preview for project manager UI.
 * @param {object} project
 * @param {string} [pageSlug]
 * @param {{ origin?: string; isActiveProject?: boolean }} [options]
 */
export function buildPublicPreviewUrl(project, pageSlug, options = {}) {
  if (!project) return '/';

  const origin = options.origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const homeSlug = project.homeSlug || 'home';
  const slug = pageSlug || homeSlug;
  const isHome = slug === homeSlug;
  const domain = project.domain ? String(project.domain).replace(/^www\./, '') : null;

  if (domain) {
    const base = buildDomainOrigin(domain, origin);
    return isHome ? `${base}/` : `${base}/${slug}`;
  }

  if (origin) {
    try {
      const { hostname } = new URL(origin);
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (options.isActiveProject) {
          return isHome ? `${origin}/` : `${origin}/${slug}`;
        }
        const projectSlug = project.slug;
        if (!projectSlug) return isHome ? `${origin}/` : `${origin}/${slug}`;
        return isHome ? `${origin}/${projectSlug}/${homeSlug}` : `${origin}/${projectSlug}/${slug}`;
      }
    } catch {
      /* ignore */
    }
  }

  const projectSlug = project.slug;
  if (!projectSlug) return isHome ? '/' : `/${slug}`;
  return isHome ? `/${projectSlug}/${homeSlug}` : `/${projectSlug}/${slug}`;
}

export function buildProjectHomePreviewUrl(project, options = {}) {
  return buildPublicPreviewUrl(project, project?.homeSlug || 'home', options);
}

/**
 * @param {string} domain
 * @param {string} [origin]
 */
function buildDomainOrigin(domain, origin) {
  const host = String(domain || '').trim().replace(/^www\./, '');
  if (!host) return '/';

  if (isLocalDevOrigin(origin)) {
    const port = localDevPort(origin);
    return `http://${host}:${port}`;
  }

  return `https://${host}`;
}

/**
 * @param {string} [origin]
 */
function isLocalDevOrigin(origin) {
  if (!origin) return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * @param {string} [origin]
 */
function localDevPort(origin) {
  if (!origin) {
    const envPort = typeof process !== 'undefined' ? process.env.PORT : '';
    return envPort ? String(envPort) : '3000';
  }
  try {
    const u = new URL(origin);
    return u.port || '3000';
  } catch {
    return '3000';
  }
}
