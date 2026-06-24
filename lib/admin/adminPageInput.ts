import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';

const PAGE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class AdminPageValidationError extends Error {
  code: 'VALIDATION' | 'CONFLICT';

  constructor(message: string, code: 'VALIDATION' | 'CONFLICT' = 'VALIDATION') {
    super(message);
    this.name = 'AdminPageValidationError';
    this.code = code;
  }
}

export function parsePageId(pageId: string): bigint {
  const raw = String(pageId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    throw new AdminPageValidationError('Invalid pageId');
  }
  return BigInt(raw);
}

export function validatePageTitle(title: unknown): string {
  const value = String(title ?? '').trim();
  if (!value) {
    throw new AdminPageValidationError('title is required');
  }
  if (value.length > 255) {
    throw new AdminPageValidationError('title is too long');
  }
  return value;
}

export function validatePageSlug(slug: unknown): string {
  const normalized = normalizeBuilderSlug(String(slug ?? ''));
  if (!normalized) {
    throw new AdminPageValidationError('slug is required');
  }
  if (normalized.length > 180) {
    throw new AdminPageValidationError('slug is too long');
  }
  if (!PAGE_SLUG_RE.test(normalized)) {
    throw new AdminPageValidationError('slug must be URL-safe (lowercase letters, numbers, hyphens)');
  }
  return normalized;
}

export function validateDraftContent(content: unknown): Record<string, unknown> {
  if (content == null || typeof content !== 'object' || Array.isArray(content)) {
    throw new AdminPageValidationError('content must be a JSON object');
  }
  return content as Record<string, unknown>;
}

function optionalString(value: unknown, maxLen: number, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (!str) return null;
  if (str.length > maxLen) {
    throw new AdminPageValidationError(`${field} is too long`);
  }
  return str;
}

function optionalUrl(value: unknown, field: string): string | null | undefined {
  const str = optionalString(value, 2048, field);
  if (str === undefined || str === null) return str;
  if (/^https?:\/\//i.test(str) || str.startsWith('/')) return str;
  throw new AdminPageValidationError(`${field} must be an absolute URL or site path`);
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  throw new AdminPageValidationError('robots flags must be boolean');
}

export function validatePageSeoInput(input: {
  seoTitle?: unknown;
  seoDescription?: unknown;
  seoKeywords?: unknown;
  ogImage?: unknown;
  robotsIndex?: unknown;
  robotsFollow?: unknown;
  canonicalUrl?: unknown;
}) {
  const data: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    ogImage?: string | null;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    canonicalUrl?: string | null;
  } = {};

  if (input.seoTitle !== undefined) data.seoTitle = optionalString(input.seoTitle, 255, 'seoTitle');
  if (input.seoDescription !== undefined) {
    data.seoDescription = optionalString(input.seoDescription, 512, 'seoDescription');
  }
  if (input.seoKeywords !== undefined) {
    data.seoKeywords = optionalString(input.seoKeywords, 512, 'seoKeywords');
  }
  if (input.ogImage !== undefined) data.ogImage = optionalUrl(input.ogImage, 'ogImage');
  if (input.canonicalUrl !== undefined) {
    data.canonicalUrl = optionalUrl(input.canonicalUrl, 'canonicalUrl');
  }
  if (input.robotsIndex !== undefined) data.robotsIndex = optionalBoolean(input.robotsIndex);
  if (input.robotsFollow !== undefined) data.robotsFollow = optionalBoolean(input.robotsFollow);

  return data;
}
