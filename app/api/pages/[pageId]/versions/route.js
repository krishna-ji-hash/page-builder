import { fail, ok } from '@/lib/api';
import { listPageVersionHistory } from '@/services/platform/pageVersionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const pageId = Number((await params).pageId);
  try {
    const versions = await listPageVersionHistory(pageId);
    return ok({ versions });
  } catch (error) {
    return fail('Failed to list versions', 500, error.message);
  }
}
