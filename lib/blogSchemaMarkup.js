/**
 * Blog post schema markup helpers (admin SEO tab ↔ SEO engine ↔ JsonLd).
 */

export const BLOG_SCHEMA_TYPE_OPTIONS = Object.freeze([
  { value: 'article', label: 'Article (BlogPosting)', seoType: 'BlogPosting' },
  { value: 'product', label: 'Product', seoType: 'Product' },
  { value: 'faq', label: 'FAQ', seoType: 'FAQ' },
  { value: 'custom', label: 'Custom (JSON-LD)', seoType: '' },
]);

const ALLOWED = new Set(BLOG_SCHEMA_TYPE_OPTIONS.map((o) => o.value));

export function normalizeBlogSchemaType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (ALLOWED.has(raw)) return raw;
  if (raw === 'blogposting' || raw === 'article') return 'article';
  return 'article';
}

/**
 * Parse/validate custom JSON-LD. Accepts object or JSON string.
 * @returns {{ ok: true, value: object | object[] | null } | { ok: false, error: string }}
 */
export function parseBlogSchemaJsonLd(raw) {
  if (raw == null || raw === '') return { ok: true, value: null };
  if (typeof raw === 'object') {
    return { ok: true, value: raw };
  }
  const text = String(raw).trim();
  if (!text) return { ok: true, value: null };
  try {
    const parsed = JSON.parse(text);
    if (parsed == null || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
      return { ok: false, error: 'Custom schema must be a JSON object or array' };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: 'Custom schema JSON is invalid' };
  }
}

export function stringifyBlogSchemaJsonLd(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

/**
 * Map stored blog schema fields → seoEngine pageSeo schema inputs.
 */
export function blogSchemaToPageSeoFields(schemaType, schemaJsonLd) {
  const type = normalizeBlogSchemaType(schemaType);
  if (type === 'custom') {
    const parsed = parseBlogSchemaJsonLd(schemaJsonLd);
    return {
      schemaType: '',
      schemaJsonLd: parsed.ok ? parsed.value : null,
    };
  }
  const option = BLOG_SCHEMA_TYPE_OPTIONS.find((o) => o.value === type);
  return {
    schemaType: option?.seoType || 'BlogPosting',
    schemaJsonLd: null,
  };
}
