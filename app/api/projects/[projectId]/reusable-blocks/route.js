import { fail, ok, parseJsonBody } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { createReusableBlock, listReusableBlocks } from '@/services/builder/projectAssetsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const blocks = await listReusableBlocks(projectId);
    return ok({ blocks });
  } catch (error) {
    return fail('Failed to load reusable blocks', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  const body = await parseJsonBody(request);
  const pageId = Number(body?.pageId);
  const rowId = Number(body?.rowId);
  const name = body?.name;
  if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
  if (!Number.isInteger(rowId) || rowId <= 0) return fail('Invalid rowId', 400);

  try {
    const block = await createReusableBlock({ pageId, rowId, name });
    if (Number(block.projectId) !== projectId) return fail('Project mismatch', 400);
    return ok({ block }, 201);
  } catch (error) {
    if (error.message.startsWith('Invalid') || error.message.includes('not found')) {
      return fail(error.message, 400);
    }
    return fail('Failed to save reusable block', 500, error.message);
  }
}

