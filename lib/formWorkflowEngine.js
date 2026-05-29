/**
 * Post-submit workflow actions (server + client).
 */

import { normalizeFormWorkflow, normalizeWorkflowAction } from './formBuilderSchema.js';

/**
 * Client-side result after API submit succeeds.
 * @param {object} workflow
 * @param {object} states
 * @param {object} [apiResult]
 */
export function resolveClientWorkflowOutcome(workflow, states, apiResult = {}) {
  const wf = normalizeFormWorkflow(workflow);
  const actions = (wf.onSubmit || []).filter((a) => a.enabled !== false);
  let message =
    typeof apiResult.message === 'string' && apiResult.message.trim()
      ? apiResult.message.trim()
      : states?.success?.message || 'Thank you — we received your message.';
  let redirectUrl = '';

  for (const action of actions) {
    if (action.type === 'success_message' && action.message) {
      message = action.message;
    }
    if (action.type === 'redirect' && action.url) {
      redirectUrl = action.url.trim();
    }
  }

  return {
    kind: redirectUrl ? 'redirect' : 'success',
    message,
    redirectUrl,
    title: states?.success?.title || 'Thank you',
  };
}

/**
 * @param {object} params
 */
export function buildWorkflowNotificationsFromActions(workflow) {
  const wf = normalizeFormWorkflow(workflow);
  const out = { webhookUrl: '', emailTo: '', crmTag: '', notificationMessage: '' };
  for (const action of wf.onSubmit || []) {
    if (action.enabled === false) continue;
    if (action.type === 'webhook' && action.url) out.webhookUrl = action.url;
    if (action.type === 'email' && action.to) out.emailTo = action.to;
    if (action.type === 'crm_tag' && action.tag) out.crmTag = action.tag;
    if (action.type === 'notification' && action.message) out.notificationMessage = action.message;
  }
  return out;
}

export function mergeWorkflowIntoSubmitBody(body, workflow) {
  const wf = normalizeFormWorkflow(workflow);
  return {
    ...body,
    workflow: wf,
    notifications: buildWorkflowNotificationsFromActions(wf),
  };
}

export function enabledServerActions(workflow) {
  return (normalizeFormWorkflow(workflow).onSubmit || []).filter((a) => a.enabled !== false);
}

export function shouldSaveLead(workflow) {
  return enabledServerActions(workflow).some((a) => a.type === 'save_lead');
}
