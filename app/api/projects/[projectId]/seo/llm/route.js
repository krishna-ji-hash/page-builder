import { ok, fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import {
  runLlmSeoSuite,
  generateLlmSeoBlocks,
  getLlmSeoStatus,
  applyLlmFaqSchema,
} from '@/services/seo/llmSeoService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);
  try {
    const suite = await runLlmSeoSuite(projectId);
    return ok({ suite, status: getLlmSeoStatus() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to load LLM SEO suite', 500, message);
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
      const type = String(body.type || 'faq');
      if (!pageId) return fail('pageId required', 400);
      const result = await generateLlmSeoBlocks(projectId, pageId, type);
      return ok({ result });
    }

    if (action === 'apply-faq') {
      const pageId = Number(body.pageId);
      const schema = body.schema;
      if (!pageId || !schema) return fail('pageId and schema required', 400);
      const seo = await applyLlmFaqSchema(projectId, pageId, schema);
      return ok({ seo });
    }

    return fail('Unknown action', 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail(message, 500);
  }
}
