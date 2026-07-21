/**
 * Request-safe in-flight promise dedupe: concurrent callers with the same key
 * share one underlying async work. Completed results are not retained (no
 * cross-request / cross-user result cache).
 */
export function createInflightDedupe() {
  const inflight = new Map();

  return {
    run(key, fn) {
      const k = String(key);
      const existing = inflight.get(k);
      if (existing) {
        return { promise: existing, deduped: true };
      }

      const promise = Promise.resolve()
        .then(fn)
        .finally(() => {
          inflight.delete(k);
        });
      inflight.set(k, promise);
      return { promise, deduped: false };
    },
    size() {
      return inflight.size;
    },
    clear() {
      inflight.clear();
    },
  };
}
