import { MenuLocation } from '@prisma/client';
import { parsePageId } from '@/lib/admin/adminPageInput';
import { parseProjectId } from '@/lib/admin/adminProjectInput';

export class AdminMenuValidationError extends Error {
  code: 'VALIDATION' | 'CONFLICT' | 'NOT_FOUND';

  constructor(message: string, code: 'VALIDATION' | 'CONFLICT' | 'NOT_FOUND' = 'VALIDATION') {
    super(message);
    this.name = 'AdminMenuValidationError';
    this.code = code;
  }
}

export function parseMenuId(menuId: string): bigint {
  const raw = String(menuId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    throw new AdminMenuValidationError('Invalid menuId');
  }
  return BigInt(raw);
}

export function parseMenuItemId(itemId: string): bigint {
  const raw = String(itemId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    throw new AdminMenuValidationError('Invalid menu item id');
  }
  return BigInt(raw);
}

export function validateMenuName(name: unknown): string {
  const value = String(name ?? '').trim();
  if (!value) throw new AdminMenuValidationError('Menu name is required');
  if (value.length > 120) throw new AdminMenuValidationError('Menu name is too long');
  return value;
}

export function validateMenuLocation(location: unknown): MenuLocation {
  const value = String(location ?? '').trim().toUpperCase();
  if (value === 'HEADER' || value === MenuLocation.HEADER) return MenuLocation.HEADER;
  if (value === 'FOOTER' || value === MenuLocation.FOOTER) return MenuLocation.FOOTER;
  throw new AdminMenuValidationError('location must be HEADER or FOOTER');
}

export function validateMenuItemLabel(label: unknown): string {
  const value = String(label ?? '').trim();
  if (!value) throw new AdminMenuValidationError('Menu item label is required');
  if (value.length > 180) throw new AdminMenuValidationError('Menu item label is too long');
  return value;
}

export function validateMenuItemUrl(url: unknown): string {
  if (url == null) return '';
  const value = String(url).trim();
  if (value.length > 2048) throw new AdminMenuValidationError('Menu item URL is too long');
  return value;
}

export function validateMenuItemTarget(target: unknown): string {
  const value = String(target ?? '_self').trim();
  return value === '_blank' ? '_blank' : '_self';
}

export function validateSortOrder(sortOrder: unknown): number {
  if (sortOrder == null || sortOrder === '') return 0;
  const n = Number(sortOrder);
  if (!Number.isInteger(n) || n < 0 || n > 100000) {
    throw new AdminMenuValidationError('sortOrder must be a non-negative integer');
  }
  return n;
}

export function parseOptionalPageId(pageId: unknown): bigint | null {
  if (pageId == null || pageId === '') return null;
  return parsePageId(String(pageId));
}

export function parseOptionalParentId(parentId: unknown): bigint | null {
  if (parentId == null || parentId === '') return null;
  return parseMenuItemId(String(parentId));
}

export { parseProjectId };
