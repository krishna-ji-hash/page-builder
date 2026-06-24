/**
 * Host classification for middleware and domain routing.
 * Builder/admin UI and `/api/admin` are only served on builder hosts.
 */

export function normalizeHost(host: string | null | undefined): string {
  let value = String(host || '').trim().toLowerCase();
  if (!value) return '';

  value = value.replace(/^https?:\/\//, '');
  value = value.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';

  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end !== -1) value = value.slice(1, end);
  } else if (value.includes(':')) {
    value = value.split(':')[0] ?? value;
  }

  if (value.startsWith('www.') && !isLocalHost(value.slice(4))) {
    value = value.slice(4);
  }

  return value;
}

/** localhost, 127.0.0.1, ::1 */
export function isLocalHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/**
 * Builder/admin app host: local dev or `BUILDER_APP_HOST`.
 */
export function isBuilderHost(
  host: string | null | undefined,
  builderAppHost = process.env.BUILDER_APP_HOST
): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  if (isLocalHost(h)) return true;

  const configured = normalizeHost(builderAppHost || '');
  return Boolean(configured && h === configured);
}

/**
 * Any non-builder request host (custom project domains, unknown hosts).
 * Used to block `/admin`, `/d`, and `/api/admin` on client-facing domains.
 */
export function isClientDomain(
  host: string | null | undefined,
  builderAppHost = process.env.BUILDER_APP_HOST
): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  return !isBuilderHost(h, builderAppHost);
}

export function readRequestHost(
  forwardedHost: string | null | undefined,
  hostHeader: string | null | undefined
): string {
  return normalizeHost(forwardedHost) || normalizeHost(hostHeader);
}
