import { resolveTxt } from 'node:dns/promises';

export function normalizeDomainHost(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export function expectedTxtRecordValue(token) {
  return `builder-verify=${token}`;
}

export function verificationTxtHost(domain) {
  return `_builder-verify.${normalizeDomainHost(domain)}`;
}

export function flattenTxtRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.flat().map((entry) => String(entry).trim()).filter(Boolean);
}

export function txtRecordsMatch(records, expected) {
  const expectedValue = String(expected || '').trim();
  if (!expectedValue) return false;
  return flattenTxtRecords(records).some(
    (record) => record === expectedValue || record.includes(expectedValue)
  );
}

/**
 * Dev/local fallback — keeps PAT and local admin usable without real DNS.
 * Production requires TXT match unless DOMAIN_VERIFY_MANUAL=true.
 */
export function allowManualDomainVerify() {
  if (process.env.DOMAIN_VERIFY_MANUAL === 'true' || process.env.DOMAIN_VERIFY_MANUAL === '1') {
    return true;
  }
  if (process.env.DOMAIN_VERIFY_STRICT === 'true' || process.env.DOMAIN_VERIFY_STRICT === '1') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}

export async function checkTxtVerification(domain, token, { resolveTxtFn = resolveTxt } = {}) {
  const host = verificationTxtHost(domain);
  const expected = expectedTxtRecordValue(token);
  const checkedAt = new Date().toISOString();

  try {
    const records = await resolveTxtFn(host);
    const flat = flattenTxtRecords(records);
    const ok = txtRecordsMatch(records, expected);
    return {
      ok,
      host,
      expected,
      records: flat,
      error: ok ? null : `TXT record not found at ${host}. Expected: ${expected}`,
      checkedAt,
    };
  } catch (err) {
    const code = err?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return {
        ok: false,
        host,
        expected,
        records: [],
        error: `No TXT records found at ${host}`,
        checkedAt,
      };
    }
    return {
      ok: false,
      host,
      expected,
      records: [],
      error: err?.message || 'DNS lookup failed',
      checkedAt,
    };
  }
}

export class DomainVerificationError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'DomainVerificationError';
    this.verificationError = meta.verificationError || message;
    this.lastCheckedAt = meta.lastCheckedAt || null;
  }
}
