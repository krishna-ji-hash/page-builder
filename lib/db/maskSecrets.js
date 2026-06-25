/** Mask host for health/status output — never expose passwords. */
export function maskHost(host) {
  const raw = String(host || '').trim();
  if (!raw) return '(unset)';
  if (raw === '127.0.0.1' || raw === 'localhost' || raw === '::1') return raw;
  if (raw.length <= 4) return '****';
  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

export function maskUser(user) {
  const raw = String(user || '').trim();
  if (!raw) return '(unset)';
  if (raw.length <= 2) return '**';
  return `${raw[0]}***`;
}

const SECRET_ENV_KEYS = [
  'MYSQL_PASSWORD',
  'AUTH_SECRET',
  'DATABASE_URL',
  'GEMINI_API_KEY',
];

/** Remove secret env values from text before logging or API responses. */
export function redactSecrets(text) {
  let out = String(text ?? '');
  for (const key of SECRET_ENV_KEYS) {
    const val = process.env[key];
    if (val) out = out.split(val).join(`[redacted:${key}]`);
  }
  return out;
}
