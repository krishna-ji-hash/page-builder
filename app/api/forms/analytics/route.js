import { fail, ok, parseJsonBody } from '@/lib/api';
import {
  getFormAnalyticsSummary,
  recordFormAnalyticsEvent,
} from '@/services/forms/formAnalyticsService';

export async function POST(request) {
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body');

  const projectId = Number(body.projectId);
  const pageId = body.pageId != null ? Number(body.pageId) : null;
  const formId =
    typeof body.formId === 'string' || typeof body.formId === 'number' ? String(body.formId) : '';
  const event = String(body.event || '').trim().toLowerCase();

  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId');
  if (!formId.trim()) return fail('Invalid formId');

  try {
    await recordFormAnalyticsEvent({
      projectId,
      pageId,
      formNodeId: formId,
      event,
    });
    return ok({ ok: true });
  } catch (err) {
    return fail('Failed to record analytics', 500, err instanceof Error ? err.message : String(err));
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = Number(searchParams.get('projectId'));
  const pageId = searchParams.get('pageId');
  const formId = searchParams.get('formNodeId') || searchParams.get('formId');

  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId');

  try {
    const summary = await getFormAnalyticsSummary({
      projectId,
      pageId: pageId != null ? Number(pageId) : null,
      formNodeId: formId || null,
    });
    return ok({ summary });
  } catch (err) {
    return fail('Failed to load analytics', 500, err instanceof Error ? err.message : String(err));
  }
}
