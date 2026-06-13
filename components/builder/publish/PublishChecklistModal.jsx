'use client';

import '@/styles/admin/platform.css';

function statusIcon(status) {
  if (status === 'pass') return '✓';
  if (status === 'warn') return '⚠';
  return '✗';
}

export default function PublishChecklistModal({
  open,
  loading,
  error,
  pageTitle,
  checklist,
  isPublishing,
  onClose,
  onPublish,
  onPublishAnyway,
}) {
  if (!open) return null;

  const items = checklist?.items || [];
  const canPublish = checklist?.canPublish !== false;
  const hasWarnings = checklist?.hasWarnings;
  const blocking = items.filter((i) => i.status === 'fail' || i.blocking);

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Publish checklist">
      <div className="wizard-panel publish-checklist-modal">
        <h2 style={{ margin: '0 0 4px' }}>Publish checklist</h2>
        <p className="platform-shell__sub" style={{ margin: '0 0 16px' }}>
          {pageTitle || 'Page'} — review before going live
        </p>

        {loading ? <p>Running checks…</p> : null}
        {error ? (
          <p style={{ color: '#b91c1c' }} role="alert">
            {error}
          </p>
        ) : null}

        {!loading && checklist ? (
          <>
            <div className="platform-actions" style={{ marginBottom: 12 }}>
              <span className="platform-btn">Pass {checklist.summary?.pass ?? 0}</span>
              <span className="platform-btn">Warnings {checklist.summary?.warn ?? 0}</span>
              <span className="platform-btn">Blocked {checklist.summary?.fail ?? 0}</span>
              {checklist.auditScore != null ? (
                <span className="platform-btn">Audit {checklist.auditScore}/100</span>
              ) : null}
            </div>

            <ul className="publish-checklist">
              {items.map((entry) => (
                <li key={entry.id} className={`publish-checklist__item publish-checklist__item--${entry.status}`}>
                  <div className="publish-checklist__label">
                    <span aria-hidden="true">{statusIcon(entry.status)}</span>
                    <strong>{entry.label}</strong>
                  </div>
                  <div className="publish-checklist__message">{entry.message}</div>
                </li>
              ))}
            </ul>

            {blocking.length ? (
              <p className="publish-checklist__hint publish-checklist__hint--error">
                Fix blocked items before publishing, or address warnings and use Publish anyway when allowed.
              </p>
            ) : hasWarnings ? (
              <p className="publish-checklist__hint">
                Warnings detected — you can publish anyway if you accept the risk.
              </p>
            ) : (
              <p className="publish-checklist__hint">All checks passed. Ready to publish.</p>
            )}
          </>
        ) : null}

        <div className="wizard-footer">
          <button type="button" className="platform-btn" onClick={onClose} disabled={isPublishing}>
            Cancel
          </button>
          <div className="platform-actions">
            {hasWarnings && canPublish ? (
              <button
                type="button"
                className="platform-btn"
                onClick={onPublishAnyway}
                disabled={isPublishing || loading}
              >
                {isPublishing ? 'Publishing…' : 'Publish anyway'}
              </button>
            ) : null}
            <button
              type="button"
              className="platform-btn platform-btn--primary"
              onClick={onPublish}
              disabled={isPublishing || loading || !canPublish}
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
