import { normalizeDomainHost } from '../platform/domainVerification.js';

/**
 * @param {string} host
 */
export function normalizeRequestHost(host) {
  return normalizeDomainHost(host);
}

export function isLocalDevEnvironment() {
  return process.env.NODE_ENV !== 'production';
}

/**
 * @param {string} domain
 */
export function isLocalDevDomain(domain) {
  return String(domain || '').toLowerCase().endsWith('.local');
}

/**
 * Placeholder for production DNS A/CNAME verification.
 * Replace with real resolve4/resolveCname checks against platform ingress targets.
 *
 * @param {string} _domain
 * @returns {Promise<{ ok: boolean; pending?: boolean; message: string }>}
 */
export async function checkDnsAOrCnameStub(_domain) {
  return {
    ok: false,
    pending: true,
    message: 'DNS A/CNAME verification is not configured yet',
  };
}

/**
 * Simple domain verification for admin project manager.
 * Does not affect public routing — status is informational only.
 *
 * @param {string | null | undefined} domain
 * @param {string} requestHost
 * @returns {Promise<{
 *   status: 'PENDING' | 'VERIFIED' | 'FAILED';
 *   verified: boolean;
 *   message: string;
 *   method: string | null;
 * }>}
 */
export async function verifyProjectDomainHost(domain, requestHost) {
  const normalizedDomain = normalizeDomainHost(domain);
  if (!normalizedDomain) {
    return {
      status: 'FAILED',
      verified: false,
      message: 'No domain configured on this project',
      method: null,
    };
  }

  const serverHost = normalizeRequestHost(requestHost);

  if (isLocalDevEnvironment() && isLocalDevDomain(normalizedDomain)) {
    return {
      status: 'VERIFIED',
      verified: true,
      message: 'Local .local domain auto-verified for development',
      method: 'local-dev',
    };
  }

  if (serverHost && serverHost === normalizedDomain) {
    return {
      status: 'VERIFIED',
      verified: true,
      message: 'Domain matches the current request host',
      method: 'host-match',
    };
  }

  if (isLocalDevEnvironment()) {
    return {
      status: 'PENDING',
      verified: false,
      message:
        'Use a .local domain or map this host in your hosts file, then verify again from that host',
      method: 'dev-pending',
    };
  }

  const dns = await checkDnsAOrCnameStub(normalizedDomain);
  if (dns.ok) {
    return {
      status: 'VERIFIED',
      verified: true,
      message: dns.message || 'DNS records verified',
      method: 'dns',
    };
  }

  if (dns.pending) {
    return {
      status: 'PENDING',
      verified: false,
      message: dns.message || 'DNS verification pending',
      method: 'dns-stub',
    };
  }

  return {
    status: 'FAILED',
    verified: false,
    message: dns.message || 'DNS verification failed',
    method: 'dns',
  };
}
