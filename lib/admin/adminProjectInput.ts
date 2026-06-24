import { ProjectStatus } from '@prisma/client';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class AdminProjectValidationError extends Error {
  code: 'VALIDATION' | 'CONFLICT';

  constructor(message: string, code: 'VALIDATION' | 'CONFLICT' = 'VALIDATION') {
    super(message);
    this.name = 'AdminProjectValidationError';
    this.code = code;
  }
}

export function normalizeProjectDomain(input: unknown): string | null {
  if (input == null || input === '') return null;
  let value = String(input).trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/\/+$/, '');
  value = value.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';
  value = value.replace(/^www\./, '');
  value = value.replace(/:\d+$/, '');

  return value || null;
}

export function validateProjectSlug(slug: unknown): string {
  const normalized = normalizeBuilderSlug(String(slug ?? ''));
  if (!normalized) {
    throw new AdminProjectValidationError('slug is required');
  }
  if (normalized.length > 120) {
    throw new AdminProjectValidationError('slug is too long');
  }
  if (!SLUG_RE.test(normalized)) {
    throw new AdminProjectValidationError('slug must be URL-safe (lowercase letters, numbers, hyphens)');
  }
  return normalized;
}

export function validateProjectName(name: unknown): string {
  const value = String(name ?? '').trim();
  if (!value) {
    throw new AdminProjectValidationError('name is required');
  }
  if (value.length > 255) {
    throw new AdminProjectValidationError('name is too long');
  }
  return value;
}

export function validateOptionalDomain(domain: unknown): string | null {
  if (domain == null || domain === '') return null;
  const normalized = normalizeProjectDomain(domain);
  if (!normalized) {
    throw new AdminProjectValidationError('domain is invalid');
  }
  if (normalized.includes(' ')) {
    throw new AdminProjectValidationError('domain cannot contain spaces');
  }
  if (normalized.length > 253) {
    throw new AdminProjectValidationError('domain is too long');
  }
  return normalized;
}

export function validateProjectStatus(status: unknown): ProjectStatus | undefined {
  if (status == null || status === '') return undefined;
  const value = String(status).toUpperCase();
  if (value === 'ACTIVE' || value === ProjectStatus.ACTIVE) return ProjectStatus.ACTIVE;
  if (value === 'ARCHIVED' || value === ProjectStatus.ARCHIVED) return ProjectStatus.ARCHIVED;
  throw new AdminProjectValidationError('status must be ACTIVE or ARCHIVED');
}

export function validateHomeSlug(homeSlug: unknown): string | undefined {
  if (homeSlug == null || homeSlug === '') return undefined;
  const normalized = normalizeBuilderSlug(String(homeSlug));
  if (!normalized) {
    throw new AdminProjectValidationError('homeSlug is invalid');
  }
  if (normalized.length > 180) {
    throw new AdminProjectValidationError('homeSlug is too long');
  }
  return normalized;
}

export function parseProjectId(projectId: string): bigint {
  const raw = String(projectId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    throw new AdminProjectValidationError('Invalid projectId');
  }
  return BigInt(raw);
}
