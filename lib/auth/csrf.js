import { isAuthDisabled } from './publicPaths.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(String(value)).origin;
  } catch {
    return null;
  }
}

function isPrivateLanHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host || host === 'localhost') return true;
  if (host === '127.0.0.1') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

function isDevLanOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return isPrivateLanHostname(hostname);
  } catch {
    return false;
  }
}

function originAllowed(origin, allowed) {
  if (!origin) return false;
  if (allowed.has(origin)) return true;
  return isDevLanOrigin(origin);
}

function collectAllowedOrigins() {
  const origins = new Set();
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BATTLE_BASE_URL,
  ];

  const builderHost = String(process.env.BUILDER_APP_HOST || '').trim();
  if (builderHost) {
    if (builderHost.startsWith('http://') || builderHost.startsWith('https://')) {
      candidates.push(builderHost);
    } else {
      candidates.push(`https://${builderHost}`);
      if (process.env.NODE_ENV !== 'production') {
        candidates.push(`http://${builderHost}`);
      }
    }
  }

  for (const raw of candidates) {
    const origin = normalizeOrigin(raw);
    if (origin) origins.add(origin);
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return origins;
}

export function isMutationMethod(method) {
  return MUTATION_METHODS.has(String(method || '').toUpperCase());
}

/**
 * Origin / Referer check for cookie-authenticated admin mutations (CSRF mitigation).
 */
export function verifyAdminMutationOrigin(request) {
  if (isAuthDisabled()) return { ok: true };
  if (!request || !isMutationMethod(request.method)) return { ok: true };

  const allowed = collectAllowedOrigins();
  const origin = normalizeOrigin(request.headers?.get?.('origin'));
  if (origin) {
    return originAllowed(origin, allowed) ? { ok: true } : { ok: false, reason: 'Invalid origin' };
  }

  const referer = request.headers?.get?.('referer');
  const refererOrigin = normalizeOrigin(referer);
  if (refererOrigin) {
    return originAllowed(refererOrigin, allowed) ? { ok: true } : { ok: false, reason: 'Invalid referer' };
  }

  if (process.env.NODE_ENV === 'production' && allowed.size > 0) {
    return { ok: false, reason: 'Missing origin' };
  }

  return { ok: true };
}
