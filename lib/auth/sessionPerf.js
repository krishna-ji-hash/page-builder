/**
 * Development-only session resolve instrumentation.
 * Never logs tokens, cookies, passwords, or user PII.
 */

function store() {
  if (!globalThis.__bldAuthSessionPerf) {
    globalThis.__bldAuthSessionPerf = {
      resolveCount: 0,
      dedupeHits: 0,
      totalMs: 0,
      lastMs: 0,
    };
  }
  return globalThis.__bldAuthSessionPerf;
}

export function isSessionPerfEnabled() {
  return process.env.NODE_ENV === 'development';
}

export function recordSessionResolve(durationMs, { deduped = false } = {}) {
  if (!isSessionPerfEnabled()) return;
  const s = store();
  if (deduped) {
    s.dedupeHits += 1;
    return;
  }
  s.resolveCount += 1;
  const ms = Number(durationMs) || 0;
  s.lastMs = ms;
  s.totalMs += ms;
  // eslint-disable-next-line no-console
  console.info(
    `[auth-session-perf] resolve#${s.resolveCount} ${ms}ms (dedupeHits=${s.dedupeHits} totalMs=${s.totalMs})`
  );
}

export function getSessionPerfSnapshot() {
  return { ...store() };
}

export function resetSessionPerfForTests() {
  globalThis.__bldAuthSessionPerf = {
    resolveCount: 0,
    dedupeHits: 0,
    totalMs: 0,
    lastMs: 0,
  };
}
