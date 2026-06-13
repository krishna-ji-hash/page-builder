const buckets = new Map();

/**
 * Simple in-memory rate limiter (per-process).
 * Suitable for login and form submit throttling on single-node deploys.
 */
export function checkRateLimit(key, { max = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucketKey = String(key);
  let bucket = buckets.get(bucketKey);
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(bucketKey, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfterSec = Math.ceil((windowMs - (now - bucket.start)) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true, retryAfterSec: 0 };
}
