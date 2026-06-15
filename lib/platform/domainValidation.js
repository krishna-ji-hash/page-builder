const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export function validateDomainInput(input) {
  const domain = normalizeDomain(input);
  if (!domain) return { ok: false, error: 'Enter a domain name' };
  if (domain.includes(' ')) return { ok: false, error: 'Domain cannot contain spaces' };
  if (domain.startsWith('www.')) {
    return { ok: false, error: 'Use the root domain only (example.com, not www.example.com)' };
  }
  if (domain.length > 253) return { ok: false, error: 'Domain is too long' };
  if (!DOMAIN_RE.test(domain)) return { ok: false, error: 'Invalid domain format' };
  return { ok: true, domain };
}
