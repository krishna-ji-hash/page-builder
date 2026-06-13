import { fail, ok, parseJsonBody } from '@/lib/api';
import { getClientIp } from '@/lib/auth/clientIp';
import { checkFormSubmitRateLimit } from '@/lib/auth/formRateLimit';
import { shouldSaveLead } from '@/lib/formWorkflowEngine.js';
import { validateFormFields } from '@/lib/runtime/formValidation';
import { runFormSubmitWorkflow } from '@/services/forms/formWorkflowService';
import { recordFormAnalyticsEvent } from '@/services/forms/formAnalyticsService';
import { createFormSubmission } from '@/services/forms/formSubmissionsService';

function safeNotifications(n) {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return null;
  const webhookUrl = typeof n.webhookUrl === 'string' ? n.webhookUrl.trim() : '';
  const emailTo = typeof n.emailTo === 'string' ? n.emailTo.trim() : '';
  const crmTag = typeof n.crmTag === 'string' ? n.crmTag.trim() : '';
  return {
    webhookUrl: webhookUrl.slice(0, 300),
    emailTo: emailTo.slice(0, 200),
    crmTag: crmTag.slice(0, 64),
  };
}

export async function POST(request) {
  const ip = getClientIp(request);
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body');

  const projectId = Number(body.projectId);
  const pageId = Number(body.pageId);
  const formId = typeof body.formId === 'string' || typeof body.formId === 'number' ? String(body.formId) : '';
  const values = body.values && typeof body.values === 'object' && !Array.isArray(body.values) ? body.values : null;

  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId');
  if (!Number.isInteger(pageId) || pageId <= 0) return fail('Invalid pageId');
  if (!formId.trim()) return fail('Invalid formId');
  if (!values) return fail('Invalid values');

  const limit = checkFormSubmitRateLimit(ip, `${projectId}:${pageId}:${formId}`);
  if (!limit.allowed) {
    return fail(`Too many submissions. Retry in ${limit.retryAfterSec}s`, 429);
  }

  const fields = Array.isArray(body.fields) ? body.fields : null;
  if (fields) {
    const v = validateFormFields(values, fields);
    if (!v.ok) return fail('Validation failed', 400, v.errors);
  }

  const workflow = body.workflow && typeof body.workflow === 'object' ? body.workflow : null;
  const notifications = safeNotifications(body.notifications);
  const meta = {
    ip,
    ua: String(request.headers.get('user-agent') || '').slice(0, 300),
    ref: String(request.headers.get('referer') || '').slice(0, 500),
    notifications: notifications || undefined,
  };

  try {
    let submissionId = null;
    if (shouldSaveLead(workflow) || !workflow) {
      const created = await createFormSubmission({
        projectId,
        pageId,
        formNodeId: formId,
        values,
        meta,
        status: notifications?.crmTag ? `tagged:${notifications.crmTag}` : 'received',
      });
      submissionId = created.id;
    }

    const wfResult = await runFormSubmitWorkflow({
      workflow,
      values,
      projectId,
      pageId,
      formNodeId: formId,
      submissionId,
      meta,
    });

    if (wfResult.crmTag) {
      meta.crmTag = wfResult.crmTag;
    }

    try {
      await recordFormAnalyticsEvent({
        projectId,
        pageId,
        formNodeId: formId,
        event: 'submit',
      });
    } catch {
      // analytics must not block submit
    }

    return ok({
      ok: true,
      submissionId,
      message: wfResult.successMessage || 'Thank you — we received your message.',
      workflow: wfResult,
    });
  } catch (err) {
    return fail('Failed to store submission', 500, err instanceof Error ? err.message : String(err));
  }
}
