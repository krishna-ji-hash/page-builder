'use client';

import { useCallback, useEffect, useState } from 'react';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function FormLeadsPanel({ pageId, projectId, formNodeId, fields = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const pg = Number(pageId);
    const pj = Number(projectId);
    const fid = formNodeId != null ? String(formNodeId) : '';
    if (!Number.isInteger(pg) || pg <= 0 || !Number.isInteger(pj) || pj <= 0 || !fid) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/pages/${pg}/form-submissions?projectId=${pj}&formNodeId=${encodeURIComponent(fid)}&limit=25`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || json?.details || 'Failed to load leads');
      }
      const list = json?.submissions ?? json?.data?.submissions ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pageId, projectId, formNodeId]);

  useEffect(() => {
    load();
  }, [load]);

  const fieldLabels = Object.fromEntries(
    (fields || []).map((f) => [String(f?.name || ''), String(f?.label || f?.name || '')])
  );

  return (
    <div className="bld-form-leads">
      <div className="bld-form-leads__head">
        <div className="bld-form-leads__title">Where leads go</div>
        <button type="button" className="bld-btn bld-btn--ghost" onClick={load} disabled={loading}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>
      <p className="bld-form-leads__intro">
        Every submit is saved in your database table <strong>form_submissions</strong> for this project. Optional
        webhook URL fires a JSON POST; email address is stored for future mail delivery.
      </p>
      <p className="bld-form-leads__hint">
        Left column text (title, office, phone): click each <strong>Heading</strong> or <strong>Text</strong> in the
        canvas or Layers panel → edit in Content tab.
      </p>
      {error ? <p className="bld-field-error">{error}</p> : null}
      {!loading && rows.length === 0 && !error ? (
        <p className="bld-panel__hint">No submissions yet. Test on live site or Preview after Publish.</p>
      ) : null}
      {rows.length ? (
        <div className="bld-form-leads__list">
          {rows.map((row) => {
            const vals = row.values && typeof row.values === 'object' ? row.values : {};
            return (
              <details key={row.id} className="bld-form-leads__item">
                <summary>
                  <span className="bld-form-leads__when">{formatWhen(row.createdAt)}</span>
                  <span className="bld-form-leads__id">#{row.id}</span>
                </summary>
                <dl className="bld-form-leads__dl">
                  {Object.entries(vals).map(([key, val]) => (
                    <div key={key} className="bld-form-leads__row">
                      <dt>{fieldLabels[key] || key}</dt>
                      <dd>{String(val ?? '')}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
