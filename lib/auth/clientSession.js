/**
 * Browser-side auth fetch consolidation: in-flight dedupe + short private cache.
 * Does not cache on public pages — callers are admin login/shell only.
 */

const ME_TTL_MS = 5_000;
const CHECK_TTL_MS = 5_000;

let meInflight = null;
let meCache = null;
let meCacheAt = 0;

let checkInflight = null;
let checkCache = null;
let checkCacheAt = 0;

let clientNavId = 0;
let clientFetchCount = 0;

function now() {
  return Date.now();
}

function isFresh(cachedAt, ttl) {
  return cachedAt > 0 && now() - cachedAt < ttl;
}

export function invalidateClientSessionCache() {
  meInflight = null;
  meCache = null;
  meCacheAt = 0;
  checkInflight = null;
  checkCache = null;
  checkCacheAt = 0;
}

/** Call on admin soft-navigation to reset per-nav counters (dev). */
export function beginClientAuthNavigation() {
  clientNavId += 1;
  clientFetchCount = 0;
  return clientNavId;
}

function recordClientFetch(kind) {
  clientFetchCount += 1;
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(
      `[auth-session-perf] client ${kind} fetch#${clientFetchCount} nav=${clientNavId}`
    );
  }
}

export function getClientAuthFetchStats() {
  return { navId: clientNavId, fetchCount: clientFetchCount };
}

/**
 * GET /api/auth/me with in-flight dedupe and short TTL cache.
 * @returns {Promise<{ ok: boolean, status: number, data: object|null }>}
 */
export async function fetchAuthMe(options = {}) {
  const force = Boolean(options.force);
  if (!force && meCache && isFresh(meCacheAt, ME_TTL_MS)) {
    return meCache;
  }
  if (!force && meInflight) return meInflight;

  meInflight = (async () => {
    recordClientFetch('me');
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      const result = { ok: res.ok, status: res.status, data };
      meCache = result;
      meCacheAt = now();
      return result;
    } catch {
      const result = { ok: false, status: 0, data: null };
      meCache = result;
      meCacheAt = now();
      return result;
    } finally {
      meInflight = null;
    }
  })();

  return meInflight;
}

/**
 * GET /api/auth/session-check with in-flight dedupe and short TTL cache.
 * Response contract: { valid, role?, userId? } when ok.
 */
export async function fetchSessionCheck(options = {}) {
  const force = Boolean(options.force);
  if (!force && checkCache && isFresh(checkCacheAt, CHECK_TTL_MS)) {
    return checkCache;
  }
  if (!force && checkInflight) return checkInflight;

  checkInflight = (async () => {
    recordClientFetch('session-check');
    try {
      const res = await fetch('/api/auth/session-check', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      const result = {
        ok: res.ok,
        status: res.status,
        valid: Boolean(res.ok && data?.valid),
        data,
      };
      checkCache = result;
      checkCacheAt = now();
      return result;
    } catch {
      const result = { ok: false, status: 0, valid: false, data: {} };
      checkCache = result;
      checkCacheAt = now();
      return result;
    } finally {
      checkInflight = null;
    }
  })();

  return checkInflight;
}

/** Test helpers */
export function __resetClientSessionForTests() {
  invalidateClientSessionCache();
  clientNavId = 0;
  clientFetchCount = 0;
}

export function __setClientSessionTestHooks({ fetchImpl } = {}) {
  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }
}
