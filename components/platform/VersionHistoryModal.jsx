'use client';

import { useCallback, useEffect, useState } from 'react';
import '@/styles/admin/platform.css';

export default function VersionHistoryModal({
  open,
  pageId,
  pageTitle,
  onClose,
  onRestored,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pages/${pageId}/versions`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load versions');
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open && pageId) load();
  }, [open, pageId, load]);

  if (!open) return null;

  const runAction = async (versionId, action) => {
    setBusyId(versionId);
    setError('');
    try {
      const res = await fetch(`/api/pages/${pageId}/versions/${versionId}?action=${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      if (action === 'restore') {
        onRestored?.(data);
        onClose?.();
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Version history">
      <div className="wizard-panel version-modal">
        <h2 style={{ margin: '0 0 4px' }}>Version history</h2>
        <p className="platform-shell__sub" style={{ margin: '0 0 16px' }}>
          {pageTitle || 'Page'} — published snapshots (restore updates draft only).
        </p>

        {loading && <p>Loading versions…</p>}
        {error && (
          <p style={{ color: '#b91c1c' }} role="alert">
            {error}
          </p>
        )}

        <ul className="version-list">
          {versions.map((v) => (
            <li key={v.id}>
              <div>
                <strong>v{v.versionNumber}</strong>
                {v.isLive && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#16a34a' }}>Live</span>
                )}
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {v.publishDate ? new Date(v.publishDate).toLocaleString() : '—'} · {v.author}
                </div>
              </div>
              <div className="platform-actions">
                <button
                  type="button"
                  className="platform-btn"
                  disabled={busyId === v.id}
                  onClick={() =>
                    window.open(`/api/pages/${pageId}/versions/${v.id}`, '_blank', 'noopener')
                  }
                >
                  Preview JSON
                </button>
                <button
                  type="button"
                  className="platform-btn"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'duplicate')}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="platform-btn platform-btn--primary"
                  disabled={busyId === v.id}
                  onClick={() => runAction(v.id, 'restore')}
                >
                  Restore
                </button>
              </div>
            </li>
          ))}
        </ul>

        {!loading && !versions.length && !error && <p>No published versions yet.</p>}

        <div className="wizard-footer">
          <button type="button" className="platform-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
