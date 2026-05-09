'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadAppsForProject } from '@/lib/registry/appLoader';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export default function AppManagerShell({ projectId }) {
  const [apps, setApps] = useState([]);
  const [enabledAppIds, setEnabledAppIds] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const enabledSet = useMemo(() => new Set(enabledAppIds), [enabledAppIds]);

  const load = async () => {
    setError('');
    const data = await fetchJson(`/api/projects/${projectId}/apps`, { cache: 'no-store' });
    setApps(Array.isArray(data.apps) ? data.apps : []);
    setEnabledAppIds(Array.isArray(data.enabledAppIds) ? data.enabledAppIds : []);
    await loadAppsForProject({ projectId, enabledAppIds: Array.isArray(data.enabledAppIds) ? data.enabledAppIds : [] });
  };

  useEffect(() => {
    load().catch((e) => setError(e?.message || 'Failed to load apps'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const toggle = async (appId, nextEnabled) => {
    setBusyId(appId);
    setError('');
    try {
      const data = await fetchJson(`/api/projects/${projectId}/apps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, enabled: nextEnabled }),
      });
      const next = Array.isArray(data.enabledAppIds) ? data.enabledAppIds : [];
      setEnabledAppIds(next);
      await loadAppsForProject({ projectId, enabledAppIds: next });
    } catch (e) {
      setError(e?.message || 'Failed to update app');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>App Manager</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Enable/disable apps per project (lazy-loaded)</div>
        </div>
        <button className="bld-btn bld-btn--info" type="button" onClick={() => load()} disabled={Boolean(busyId)}>
          Refresh
        </button>
      </div>

      {error ? <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 700 }}>{error}</div> : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {apps.map((a) => {
          const enabled = enabledSet.has(a.id);
          return (
            <div
              key={a.id}
              style={{
                border: '1px solid rgba(148,163,184,0.35)',
                borderRadius: 12,
                padding: 12,
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{a.icon || '▦'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name} <span style={{ opacity: 0.7, fontWeight: 700 }}>v{a.version}</span>
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>{a.description || ''}</div>
                  </div>
                </div>
                <button
                  className={`bld-btn ${enabled ? 'bld-btn--warning' : 'bld-btn--success'}`.trim()}
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => toggle(a.id, !enabled)}
                >
                  {enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(Array.isArray(a.capabilities) ? a.capabilities : []).map((c) => (
                  <span key={c} className="bld-chip">
                    {c}
                  </span>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <div style={{ fontWeight: 800 }}>Registered</div>
                  <div>Widgets/Templates/Routes integrate next.</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <div style={{ fontWeight: 800 }}>State</div>
                  <div>{enabled ? 'Enabled (loaded)' : 'Disabled (not loaded)'}</div>
                </div>
              </div>
            </div>
          );
        })}
        {!apps.length ? <div style={{ opacity: 0.75 }}>No apps found.</div> : null}
      </div>
    </div>
  );
}

