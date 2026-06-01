import { fail, ok } from '@/lib/api';
import {
  duplicatePageVersion,
  getPageVersionPreview,
  restorePageVersionToDraft,
} from '@/services/platform/pageVersionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const pageId = Number((await params).pageId);
  const versionId = Number((await params).versionId);
  try {
    const preview = await getPageVersionPreview(pageId, versionId);
    if (!preview) return fail('Version not found', 404);
    return ok({ preview });
  } catch (error) {
    return fail('Failed to load version preview', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const pageId = Number((await params).pageId);
  const versionId = Number((await params).versionId);
  const action = request.nextUrl.searchParams.get('action');
  try {
    if (action === 'restore') {
      const result = await restorePageVersionToDraft(pageId, versionId);
      return ok(result);
    }
    if (action === 'duplicate') {
      const result = await duplicatePageVersion(pageId, versionId);
      return ok(result);
    }
    return fail('Unknown action. Use ?action=restore|duplicate', 400);
  } catch (error) {
    return fail('Version action failed', 500, error.message);
  }
}
