import { NextResponse } from 'next/server';
import { AdminMediaValidationError } from '@/lib/admin/adminMediaInput';
import { AdminMenuValidationError } from '@/lib/admin/adminMenuInput';
import { AdminPageValidationError } from '@/lib/admin/adminPageInput';
import { AdminProjectValidationError } from '@/lib/admin/adminProjectInput';

export function mapAdminApiError(error: unknown) {
  if (
    error instanceof AdminPageValidationError ||
    error instanceof AdminProjectValidationError ||
    error instanceof AdminMenuValidationError ||
    error instanceof AdminMediaValidationError
  ) {
    const status =
      error.code === 'CONFLICT'
        ? 409
        : error.code === 'NOT_FOUND' ||
            error.message === 'Project not found' ||
            error.message === 'Page not found' ||
            error.message === 'Menu not found' ||
            error.message === 'Menu item not found' ||
            error.message === 'Media not found' ||
            error.message === 'Invalid projectId' ||
            error.message === 'Invalid pageId' ||
            error.message === 'Invalid menuId'
          ? 404
          : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}
