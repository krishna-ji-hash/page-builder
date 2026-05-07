import { fail, ok, parseJsonBody } from '@/lib/api';
import { createFormSubmission } from '@/services/forms/formSubmissionsService';
import { validateFormFields } from '@/lib/runtime/formValidation';

function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff && typeof xff === 'string') return xff.split(',')[0].trim();
  const xr = request.headers.get('x-real-ip');
  if (xr && typeof xr === 'string') return xr.trim();
  return '';
}

function safeNotifications(n) {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return null;
  const webhookUrl = typeof n.webhookUrl === 'string' ? n.webhookUrl.trim() : '';
  const emailTo = typeof n.emailTo === 'string' ? n.emailTo.trim() : '';
  return { webhookUrl: webhookUrl.slice(0, 300), emailTo: emailTo.slice(0, 200) };
}

export async function POST(request) {
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

  // Optional server-side validation: fields provided by client (builder config).
  // We treat it as a hint; it must never expand trust boundaries.
  const fields = Array.isArray(body.fields) ? body.fields : null;
  if (fields) {
    const v = validateFormFields(values, fields);
    if (!v.ok) return fail('Validation failed', 400, v.errors);
  }

  const notifications = safeNotifications(body.notifications);
  const meta = {
    ip: getClientIp(request),
    ua: String(request.headers.get('user-agent') || '').slice(0, 300),
    ref: String(request.headers.get('referer') || '').slice(0, 500),
    notifications: notifications || undefined,
  };

  try {
    const created = await createFormSubmission({
      projectId,
      pageId,
      formNodeId: formId,
      values,
      meta,
    });
    return ok({ ok: true, submissionId: created.id });
  } catch (err) {
    return fail('Failed to store submission', 500, err instanceof Error ? err.message : String(err));
  }
}

