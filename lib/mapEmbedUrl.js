/** Working default for Spaze I-Tech Park (matches registry address label). */
export const DEFAULT_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.847887684!2d77.034689!3d28.4031478!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d19d582e38823%3A0x47c694e668f4116f!2sSpaze%20I-Tech%20Park!5e0!3m2!1sen!2sin!4v1718035200000!5m2!1sen!2sin';

/**
 * Google Maps "Share → Embed a map" returns a full <iframe> tag or a bare embed URL.
 * Returns a normalized https URL for iframe src, or '' when invalid.
 *
 * @param {unknown} raw
 * @param {{ keepPartial?: boolean }} [options] keepPartial — keep in-progress inspector typing
 */
export function normalizeMapEmbedUrl(raw, { keepPartial = false } = {}) {
  let value = String(raw ?? '').trim();
  if (!value) return '';

  value = value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const iframeMatch = value.match(/<iframe[\s\S]*?\ssrc\s*=\s*["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    value = iframeMatch[1].trim();
  } else if (/^src\s*=\s*["']/i.test(value)) {
    const srcOnly = value.match(/^src\s*=\s*["']([^"']+)["']/i);
    if (srcOnly?.[1]) value = srcOnly[1].trim();
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return keepPartial ? value : '';
  }
}

/** Normalize iframe paste in the inspector; bare URLs are stored as typed. */
export function normalizeMapEmbedUrlForStorage(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('<iframe')) {
    return normalizeMapEmbedUrl(trimmed);
  }
  return trimmed;
}
