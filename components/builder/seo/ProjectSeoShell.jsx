'use client';

import { useEffect, useState } from 'react';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export default function ProjectSeoShell({ projectId }) {
  const [form, setForm] = useState({
    siteTitle: '',
    titleTemplate: '{{title}} | {{siteTitle}}',
    defaultDescription: '',
    defaultOgImage: '',
    favicon: '',
    canonicalDomain: '',
    indexingEnabled: true,
    robotsIndex: true,
    robotsFollow: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setError('');
    setSaved(false);
    fetchJson(`/api/projects/${projectId}/seo`, { cache: 'no-store' })
      .then((data) => {
        const seo = data?.seo || {};
        setForm((p) => ({
          ...p,
          siteTitle: seo.siteTitle || '',
          titleTemplate: seo.titleTemplate || p.titleTemplate,
          defaultDescription: seo.defaultDescription || '',
          defaultOgImage: seo.defaultOgImage || '',
          favicon: seo.favicon || '',
          canonicalDomain: seo.canonicalDomain || '',
          indexingEnabled: seo.indexingEnabled !== false,
          robotsIndex: seo.robots?.index !== false,
          robotsFollow: seo.robots?.follow !== false,
        }));
      })
      .catch((e) => setError(e?.message || 'Failed to load SEO'));
  }, [projectId]);

  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await fetchJson(`/api/projects/${projectId}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo: {
            siteTitle: form.siteTitle,
            titleTemplate: form.titleTemplate,
            defaultDescription: form.defaultDescription,
            defaultOgImage: form.defaultOgImage,
            favicon: form.favicon,
            canonicalDomain: form.canonicalDomain,
            indexingEnabled: Boolean(form.indexingEnabled),
            robots: { index: Boolean(form.robotsIndex), follow: Boolean(form.robotsFollow) },
          },
        }),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e?.message || 'Failed to save SEO');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 14, maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Project SEO</div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Defaults applied to all pages (can be overridden per page)</div>
        </div>
        <button className="bld-btn bld-btn--success" type="button" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {error ? <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 800 }}>{error}</div> : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        <div className="bld-field">
          <label className="bld-label">Site title</label>
          <input className="bld-input" value={form.siteTitle} onChange={(e) => setForm((p) => ({ ...p, siteTitle: e.target.value }))} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Default title template</label>
          <input
            className="bld-input"
            value={form.titleTemplate}
            onChange={(e) => setForm((p) => ({ ...p, titleTemplate: e.target.value }))}
            placeholder="{{title}} | {{siteTitle}}"
          />
          <p className="bld-field-note">Supports bindings like <strong>{'{{title}}'}</strong> and <strong>{'{{siteTitle}}'}</strong>.</p>
        </div>
        <div className="bld-field">
          <label className="bld-label">Default meta description</label>
          <textarea className="bld-input" rows={3} value={form.defaultDescription} onChange={(e) => setForm((p) => ({ ...p, defaultDescription: e.target.value }))} />
        </div>
        <div className="bld-field">
          <label className="bld-label">Default OG image URL</label>
          <input className="bld-input" value={form.defaultOgImage} onChange={(e) => setForm((p) => ({ ...p, defaultOgImage: e.target.value }))} />
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Favicon URL</label>
            <input className="bld-input" value={form.favicon} onChange={(e) => setForm((p) => ({ ...p, favicon: e.target.value }))} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Canonical domain (optional)</label>
            <input className="bld-input" value={form.canonicalDomain} onChange={(e) => setForm((p) => ({ ...p, canonicalDomain: e.target.value }))} placeholder="https://example.com" />
          </div>
        </div>
        <div className="bld-field-grid">
          <div className="bld-field">
            <label className="bld-label">Indexing enabled</label>
            <select className="bld-input" value={form.indexingEnabled ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, indexingEnabled: e.target.value === 'true' }))}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Robots defaults</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                <input type="checkbox" checked={form.robotsIndex} onChange={(e) => setForm((p) => ({ ...p, robotsIndex: e.target.checked }))} />
                index
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                <input type="checkbox" checked={form.robotsFollow} onChange={(e) => setForm((p) => ({ ...p, robotsFollow: e.target.checked }))} />
                follow
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

