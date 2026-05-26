/**
 * Optional outbound hooks after a form is stored (webhook URL from form props).
 */

export async function dispatchFormNotifications({
  notifications,
  values,
  projectId,
  pageId,
  formNodeId,
  submissionId,
}) {
  const out = { webhook: null, email: null };
  if (!notifications || typeof notifications !== 'object') return out;

  const webhookUrl = typeof notifications.webhookUrl === 'string' ? notifications.webhookUrl.trim() : '';
  if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          pageId,
          formId: formNodeId,
          submissionId,
          values: values || {},
          submittedAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(12_000),
      });
      out.webhook = res.ok ? 'sent' : `http_${res.status}`;
    } catch (err) {
      out.webhook = err instanceof Error ? err.message : String(err);
    }
  }

  const emailTo = typeof notifications.emailTo === 'string' ? notifications.emailTo.trim() : '';
  if (emailTo) {
    // Stored on submission meta; wire SMTP/Resend here when configured.
    out.email = 'pending';
  }

  return out;
}
