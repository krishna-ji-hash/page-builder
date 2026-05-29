import { dispatchFormNotifications } from './dispatchFormNotifications.js';
import { normalizeFormWorkflow } from '@/lib/formBuilderSchema.js';
import { enabledServerActions } from '@/lib/formWorkflowEngine.js';

/**
 * Run server-side workflow actions after lead is saved.
 * @param {object} params
 */
export async function runFormSubmitWorkflow({
  workflow,
  values,
  projectId,
  pageId,
  formNodeId,
  submissionId,
  meta,
}) {
  const wf = normalizeFormWorkflow(workflow);
  const actions = enabledServerActions(wf);
  const result = {
    actions: [],
    crmTag: null,
    notification: null,
    webhook: null,
    email: null,
  };

  for (const action of actions) {
    if (action.type === 'save_lead') {
      result.actions.push({ type: 'save_lead', status: 'ok' });
      continue;
    }
    if (action.type === 'crm_tag' && action.tag) {
      result.crmTag = action.tag;
      result.actions.push({ type: 'crm_tag', status: 'tagged', tag: action.tag });
      continue;
    }
    if (action.type === 'notification' && action.message) {
      result.notification = action.message;
      result.actions.push({ type: 'notification', status: 'logged' });
      continue;
    }
  }

  const notify = await dispatchFormNotifications({
    notifications: {
      webhookUrl: actions.find((a) => a.type === 'webhook' && a.enabled !== false)?.url || '',
      emailTo: actions.find((a) => a.type === 'email' && a.enabled !== false)?.to || '',
    },
    values,
    projectId,
    pageId,
    formNodeId,
    submissionId,
    meta,
  });

  result.webhook = notify.webhook;
  result.email = notify.email;

  const successAction = actions.find((a) => a.type === 'success_message' && a.enabled !== false);
  result.successMessage =
    successAction?.message || 'Thank you — we received your message.';

  return result;
}
