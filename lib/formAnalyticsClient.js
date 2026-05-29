/**
 * Fire-and-forget form analytics (live + builder preview when enabled).
 */

export function trackFormEvent({ projectId, pageId, formId, event, enabled = true }) {
  if (!enabled) return;
  const pid = Number(projectId);
  const pg = Number(pageId);
  const fid = formId != null ? String(formId) : '';
  if (!Number.isInteger(pid) || pid <= 0 || !fid) return;
  if (typeof window === 'undefined') return;

  const payload = {
    projectId: pid,
    pageId: Number.isInteger(pg) && pg > 0 ? pg : null,
    formId: fid,
    event: String(event || '').trim().toLowerCase(),
  };

  fetch('/api/forms/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
