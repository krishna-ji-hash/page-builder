'use client';

import { useCallback, useEffect, useState } from 'react';
import '@/styles/admin/platform.css';
import '@/styles/builder/page-revisions.css';

function sourceLabel(source) {
  const value = String(source || '').toUpperCase();
  if (value === 'PUBLISH') return 'Published';
  if (value === 'RESTORE') return 'Restored';
  return 'Draft save';
}

function sourceBadgeClass(source) {
  const value = String(source || '').toUpperCase();
  if (value === 'PUBLISH') return 'page-revisions__badge--publish';
  if (value === 'RESTORE') return 'page-revisions__badge--restore';
  return 'page-revisions__badge--draft';
}

export default function PageRevisionsModal({ open, pageId, pageTitle, onClose, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/versions`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load revisions');
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open && pageId) void load();
  }, [open, pageId, load]);

  if (!open) return null;

  const restoreVersion = async (versionId) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Restore this revision to draft? Live published content stays unchanged until you publish.')
    ) {
      return;
    }
    setBusyId(versionId);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to restore revision');
      onRestored?.(data);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Page revisions">
      <div className="wizard-panel page-revisions">
        <h2 className="page-revisions__title">Revisions</h2>
        <p className="page-revisions__sub">
          {pageTitle || 'Page'} — restore updates draft only; publish to update the live site.
        </p>

        {loading ? <p>Loading revisions…</p> : null}
        {error ? (
          <p className="page-revisions__error" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="page-revisions__list">
          {versions.map((version) => (
            <li key={version.id} className="page-revisions__item">
              <div className="page-revisions__meta">
                <div className="page-revisions__heading">
                  <strong>Revision {version.versionNumber}</strong>
                  <span className={`page-revisions__badge ${sourceBadgeClass(version.source)}`}>
                    {sourceLabel(version.source)}
                  </span>
                  {version.isLive ? (
                    <span className="page-revisions__badge page-revisions__badge--live">Live</span>
                  ) : null}
                </div>
                <div className="page-revisions__detail">
                  {version.createdAt ? new Date(version.createdAt).toLocaleString() : '—'}
                  {version.createdByName ? ` · ${version.createdByName}` : ''}
                </div>
              </div>
              <button
                type="button"
                className="platform-btn platform-btn--primary"
                disabled={busyId === version.id}
                onClick={() => void restoreVersion(version.id)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>

        {!loading && !versions.length && !error ? <p>No revisions yet. Save or publish to create one.</p> : null}

        <div className="wizard-footer">
          <button type="button" className="platform-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
