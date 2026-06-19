import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  generateAiSeoContent,
  applyAiSeoFix,
  runBulkAiOptimization,
  getAiContentSuggestions,
  getAiSeoStatus,
} from '@/services/seo/aiSeoService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  const pageId = Number(request.nextUrl.searchParams.get('pageId')) || null;
  const mode = request.nextUrl.searchParams.get('mode');

  try {
    if (mode === 'suggestions') {
      const suggestions = await getAiContentSuggestions(projectId, pageId);
      return ok({ suggestions });
    }
    return ok({ ai: getAiSeoStatus() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('AI SEO request failed', 500, message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || 'generate');

    if (action === 'generate') {
      const pageId = Number(body.pageId);
      const type = String(body.type || 'title');
      if (!pageId) return fail('pageId required', 400);
      const result = await generateAiSeoContent(projectId, pageId, type, {
        presetId: body.presetId,
        schemaType: body.schemaType,
      });
      return ok({ result });
    }

    if (action === 'fix') {
      const pageId = Number(body.pageId);
      const fixType = String(body.fixType || body.fix || '');
      if (!pageId || !fixType) return fail('pageId and fixType required', 400);
      const result = await applyAiSeoFix(projectId, pageId, fixType, {
        presetId: body.presetId,
        schemaType: body.schemaType,
      });
      return ok({ result });
    }

    if (action === 'bulk') {
      const operation = String(body.operation || 'all');
      const result = await runBulkAiOptimization(projectId, operation, {
        presetId: body.presetId,
        schemaType: body.schemaType,
      });
      return ok({ result });
    }

    if (action === 'remediate') {
      const { runSeoRemediation } = await import('@/services/seo/seoRemediationService');
      const result = await runSeoRemediation(projectId);
      return ok({ result });
    }

    if (action === 'apply-generated') {
      const pageId = Number(body.pageId);
      const patch = body.seo && typeof body.seo === 'object' ? body.seo : {};
      if (!pageId || !Object.keys(patch).length) return fail('pageId and seo patch required', 400);
      const { patchProjectPageSeo } = await import('@/services/seo/seoDashboardService');
      const seo = await patchProjectPageSeo(projectId, pageId, patch);
      return ok({ seo });
    }

    return fail('Unknown action', 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail(message, 500);
  }
}
