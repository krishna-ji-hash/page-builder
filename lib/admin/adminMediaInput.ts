import { parseProjectId } from '@/lib/admin/adminProjectInput';

export class AdminMediaValidationError extends Error {
  code: 'VALIDATION' | 'NOT_FOUND';

  constructor(message: string, code: 'VALIDATION' | 'NOT_FOUND' = 'VALIDATION') {
    super(message);
    this.name = 'AdminMediaValidationError';
    this.code = code;
  }
}

export function parseMediaId(mediaId: string): bigint {
  const raw = String(mediaId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    throw new AdminMediaValidationError('Invalid mediaId');
  }
  return BigInt(raw);
}

export { parseProjectId };
