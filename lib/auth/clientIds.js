/**
 * Shared auth/DB id + flag helpers (no Next.js imports — safe for unit tests).
 */

/** Accept PG boolean or legacy 0/1 without changing auth semantics. */
export function isActiveFlag(value) {
  return value === true || value === 1 || value === '1' || value === 't' || value === 'true';
}

/**
 * Coerce DB id (int8 string / bigint / number) for JSON-facing APIs.
 * Prefer this over ad-hoc Number(); unsafe for ids > Number.MAX_SAFE_INTEGER
 * (those stay as string).
 */
export function toClientId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : String(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const asNumber = Number(value);
  if (Number.isSafeInteger(asNumber)) return asNumber;
  return String(value);
}
