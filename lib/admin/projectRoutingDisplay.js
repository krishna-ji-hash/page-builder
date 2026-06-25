import { buildProjectHomePreviewUrl } from './publicPreviewUrl.js';
import { collectProjectDomains } from './buildServerDomainMap.js';

/**
 * How a project is reached on localhost (only one default at a time).
 * @param {object} project
 * @param {{ isDefault?: boolean; origin?: string }} [options]
 */
export function describeLocalhostRouting(project, options = {}) {
  const origin = options.origin ?? '';
  const isDefault = Boolean(options.isDefault);

  if (!project || project.status === 'ARCHIVED') {
    return {
      kind: 'unavailable',
      title: 'Not available',
      detail: 'Archived projects are not served publicly.',
      url: null,
    };
  }

  if (isDefault) {
    const url = buildProjectHomePreviewUrl(project, { origin, isActiveProject: true });
    return {
      kind: 'default',
      title: 'Default on localhost',
      detail: url ? `Opens at ${url}` : 'Served at site root on localhost',
      url,
    };
  }

  return {
    kind: 'not-default',
    title: 'Not on localhost',
    detail: 'Use Set default — only one project can use localhost at a time.',
    url: null,
  };
}

/**
 * How a project is reached on custom domain(s) — independent of localhost default.
 * @param {object} project
 * @param {{ origin?: string }} [options]
 */
export function describeDomainRouting(project, options = {}) {
  const origin = options.origin ?? '';

  if (!project || project.status === 'ARCHIVED') {
    return {
      kind: 'unavailable',
      title: '—',
      detail: null,
      url: null,
      domain: null,
      domainStatus: null,
      domains: [],
    };
  }

  const entries = collectProjectDomains(project);
  if (!entries.length) {
    return {
      kind: 'none',
      title: 'No domain',
      detail: 'Edit → Domain for one host, or Domains page for multiple.',
      url: null,
      domain: null,
      domainStatus: null,
      domains: [],
    };
  }

  const domains = entries.map((entry) => {
    const url = buildProjectHomePreviewUrl(
      { ...project, domain: entry.domain },
      { origin, isActiveProject: false }
    );
    return {
      ...entry,
      url,
      domainStatus: entry.verified ? 'VERIFIED' : 'PENDING',
    };
  });

  const primary = domains.find((d) => d.isPrimary) || domains[0];
  const allVerified = domains.every((d) => d.verified);

  return {
    kind: allVerified ? 'verified' : 'pending',
    title: domains.length === 1 ? primary.domain : `${domains.length} server domains`,
    detail:
      domains.length === 1
        ? primary.verified
          ? 'Live on this host when DNS points to your server.'
          : 'DNS not verified — verify in Domains before production.'
        : 'Har domain alag host par isi project ko kholta hai.',
    url: primary.url,
    domain: primary.domain,
    domainStatus: primary.domainStatus,
    domains,
  };
}

/**
 * One-line summary for tooltips / search.
 * @param {object} project
 * @param {{ isDefault?: boolean; origin?: string }} [options]
 */
export function summarizeProjectRouting(project, options = {}) {
  const localhost = describeLocalhostRouting(project, options);
  const domain = describeDomainRouting(project, options);
  const parts = [];

  if (localhost.kind === 'default') parts.push('localhost default');
  if (domain.domains?.length) {
    parts.push(domain.domains.map((d) => d.domain).join(', '));
  }

  return parts.length ? parts.join(' · ') : 'no public routing';
}
