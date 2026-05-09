import { ok, fail } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getPageSeo, savePageSeo } from '@/services/builder/seoService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
  try {
    const seo = await getPageSeo(pageId);
    return ok({ seo });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Page not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to load page SEO', 500, message);
  }
}

export async function PATCH(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId', 400);
  try {
    const body = await request.json().catch(() => ({}));
    const seo = await savePageSeo(pageId, body?.seo);
    return ok({ seo });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === 'Page not found') return fail(message, 404);
    if (message.startsWith('Invalid')) return fail(message, 400);
    return fail('Failed to save page SEO', 500, message);
  }
}

