import assert from 'node:assert/strict';
import { createInflightDedupe } from '../lib/auth/inflightDedupe.js';
import { gateProtectedApiSession } from '../lib/auth/middlewareSessionGate.js';
import { AUTH_NO_STORE_HEADERS } from '../lib/auth/authNoStoreHeaders.js';
import { SESSION_COOKIE } from '../lib/auth/constants.js';
import {
  __resetClientSessionForTests,
  fetchAuthMe,
  fetchSessionCheck,
  getClientAuthFetchStats,
  invalidateClientSessionCache,
} from '../lib/auth/clientSession.js';
import {
  getSessionPerfSnapshot,
  recordSessionResolve,
  resetSessionPerfForTests,
} from '../lib/auth/sessionPerf.js';

function mockRequest(cookieHeader) {
  return {
    cookies: {
      get(name) {
        if (!cookieHeader) return undefined;
        const parts = String(cookieHeader).split(';');
        for (const part of parts) {
          const [n, ...rest] = part.trim().split('=');
          if (n === name) return { value: rest.join('=') };
        }
        return undefined;
      },
    },
    headers: {
      get(name) {
        if (String(name).toLowerCase() === 'cookie') return cookieHeader || '';
        return null;
      },
    },
  };
}

/* ---- middleware cookie gate (no HTTP session-check) ---- */
{
  const noCookie = gateProtectedApiSession(mockRequest(''));
  assert.equal(noCookie.ok, false);
  assert.equal(noCookie.status, 401);

  const withCookie = gateProtectedApiSession(
    mockRequest(`${SESSION_COOKIE}=abc123token`)
  );
  assert.equal(withCookie.ok, true);
}

/* ---- Cache-Control private/no-store contract ---- */
{
  assert.match(AUTH_NO_STORE_HEADERS['Cache-Control'], /private/);
  assert.match(AUTH_NO_STORE_HEADERS['Cache-Control'], /no-store/);
  assert.equal(AUTH_NO_STORE_HEADERS.Pragma, 'no-store');
}

/* ---- in-flight dedupe: concurrent same key → one fn ---- */
{
  const dedupe = createInflightDedupe();
  let calls = 0;
  const work = () =>
    new Promise((resolve) => {
      calls += 1;
      setTimeout(() => resolve(`user-${calls}`), 20);
    });

  const a = dedupe.run('token-a', work);
  const b = dedupe.run('token-a', work);
  assert.equal(a.deduped, false);
  assert.equal(b.deduped, true);
  assert.equal(a.promise, b.promise);

  const [ra, rb] = await Promise.all([a.promise, b.promise]);
  assert.equal(calls, 1);
  assert.equal(ra, 'user-1');
  assert.equal(rb, 'user-1');
}

/* ---- no cross-user reuse: different keys → separate work ---- */
{
  const dedupe = createInflightDedupe();
  let calls = 0;
  const work = (label) => () => {
    calls += 1;
    return Promise.resolve(label);
  };

  const a = dedupe.run('user-1-token', work('alice'));
  const b = dedupe.run('user-2-token', work('bob'));
  assert.equal(a.deduped, false);
  assert.equal(b.deduped, false);
  const [ra, rb] = await Promise.all([a.promise, b.promise]);
  assert.equal(calls, 2);
  assert.equal(ra, 'alice');
  assert.equal(rb, 'bob');
}

/* ---- completed results not retained (no stale global cache) ---- */
{
  const dedupe = createInflightDedupe();
  let generation = 0;
  const first = dedupe.run('k', () => Promise.resolve(++generation));
  await first.promise;
  assert.equal(dedupe.size(), 0);
  const second = dedupe.run('k', () => Promise.resolve(++generation));
  assert.equal(second.deduped, false);
  assert.equal(await second.promise, 2);
}

/* ---- client session: concurrent callers → one fetch ---- */
{
  __resetClientSessionForTests();
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    fetchCalls += 1;
    assert.match(String(url), /\/api\/auth\/me/);
    await new Promise((r) => setTimeout(r, 15));
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          authenticated: true,
          user: { id: 1, email: 'a@test', displayName: 'A', role: 'admin', projectIds: [] },
        };
      },
    };
  };

  try {
    const [r1, r2, r3] = await Promise.all([
      fetchAuthMe(),
      fetchAuthMe(),
      fetchAuthMe(),
    ]);
    assert.equal(fetchCalls, 1);
    assert.equal(r1.ok, true);
    assert.equal(r2.data.user.id, 1);
    assert.equal(r3.data.user.email, 'a@test');

    // short TTL cache: no second network call
    const r4 = await fetchAuthMe();
    assert.equal(fetchCalls, 1);
    assert.equal(r4.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

/* ---- logout invalidation forces refetch ---- */
{
  __resetClientSessionForTests();
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: fetchCalls === 1,
      status: fetchCalls === 1 ? 200 : 401,
      async json() {
        if (fetchCalls === 1) {
          return { authenticated: true, user: { id: 9, email: 'x@y', role: 'admin' } };
        }
        return { error: 'Unauthorized' };
      },
    };
  };

  try {
    const before = await fetchAuthMe();
    assert.equal(before.ok, true);
    assert.equal(fetchCalls, 1);

    invalidateClientSessionCache();
    const after = await fetchAuthMe({ force: true });
    assert.equal(fetchCalls, 2);
    assert.equal(after.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

/* ---- session-check client dedupe + invalid session shape ---- */
{
  __resetClientSessionForTests();
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    fetchCalls += 1;
    assert.match(String(url), /session-check/);
    return {
      ok: false,
      status: 401,
      async json() {
        return { error: 'Unauthorized' };
      },
    };
  };

  try {
    const [a, b] = await Promise.all([fetchSessionCheck(), fetchSessionCheck()]);
    assert.equal(fetchCalls, 1);
    assert.equal(a.valid, false);
    assert.equal(b.valid, false);
    assert.equal(a.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

/* ---- valid session-check contract ---- */
{
  __resetClientSessionForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { valid: true, role: 'editor', userId: 42 };
    },
  });

  try {
    const r = await fetchSessionCheck();
    assert.equal(r.valid, true);
    assert.equal(r.data.role, 'editor');
    assert.equal(r.data.userId, 42);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

/* ---- expired / invalid treated as not valid ---- */
{
  __resetClientSessionForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { valid: false };
    },
  });

  try {
    const r = await fetchSessionCheck({ force: true });
    assert.equal(r.valid, false);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

/* ---- dev perf counters (no secrets) ---- */
{
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  resetSessionPerfForTests();
  recordSessionResolve(12);
  recordSessionResolve(0, { deduped: true });
  const snap = getSessionPerfSnapshot();
  assert.equal(snap.resolveCount, 1);
  assert.equal(snap.dedupeHits, 1);
  assert.equal(snap.lastMs, 12);
  process.env.NODE_ENV = prev;
}

/* ---- client fetch stats after me calls ---- */
{
  __resetClientSessionForTests();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { authenticated: true, user: { id: 1 } };
    },
  });
  try {
    await fetchAuthMe({ force: true });
    const stats = getClientAuthFetchStats();
    assert.ok(stats.fetchCount >= 1);
  } finally {
    globalThis.fetch = originalFetch;
    __resetClientSessionForTests();
  }
}

console.log('authSessionDedupe tests passed');
