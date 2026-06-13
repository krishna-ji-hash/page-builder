'use client';

import { useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import '@/styles/admin/platform.css';
import '@/styles/admin/forms.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export default function AdminProjectSeo({ projectId }) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
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
      .catch((e) => setError(e?.message || 'Failed to load SEO'))
      .finally(() => setLoading(false));
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
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e?.message || 'Failed to save SEO');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · SEO"
        title="SEO defaults"
        description="Project-level metadata applied to all pages. Override per page in the builder when needed."
        actions={
          <button type="button" className="platform-btn platform-btn--primary" onClick={save} disabled={busy || loading}>
            {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        }
      />

      {loading ? (
        <div className="platform-skeleton platform-skeleton--card" style={{ height: 320 }} aria-hidden="true" />
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <section className="platform-panel">
          <div className="platform-panel__head">
            <div>
              <h2 className="platform-panel__title">Metadata</h2>
              <p className="platform-panel__sub">Titles, descriptions, and indexing defaults</p>
            </div>
          </div>
          <div className="platform-panel__body platform-panel__body--padded">
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="seo-site-title">Site title</label>
                <input
                  id="seo-site-title"
                  value={form.siteTitle}
                  onChange={(e) => setForm((p) => ({ ...p, siteTitle: e.target.value }))}
                  placeholder="My Company"
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="seo-title-template">Default title template</label>
                <input
                  id="seo-title-template"
                  value={form.titleTemplate}
                  onChange={(e) => setForm((p) => ({ ...p, titleTemplate: e.target.value }))}
                  placeholder="{{title}} | {{siteTitle}}"
                />
                <p className="admin-form-field__hint">
                  Bindings: <code>{'{{title}}'}</code>, <code>{'{{siteTitle}}'}</code>
                </p>
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="seo-description">Default meta description</label>
                <textarea
                  id="seo-description"
                  rows={3}
                  value={form.defaultDescription}
                  onChange={(e) => setForm((p) => ({ ...p, defaultDescription: e.target.value }))}
                  placeholder="Short description for search engines and social previews."
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="seo-og-image">Default OG image URL</label>
                <input
                  id="seo-og-image"
                  value={form.defaultOgImage}
                  onChange={(e) => setForm((p) => ({ ...p, defaultOgImage: e.target.value }))}
                  placeholder="https://…"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="seo-favicon">Favicon URL</label>
                <input
                  id="seo-favicon"
                  value={form.favicon}
                  onChange={(e) => setForm((p) => ({ ...p, favicon: e.target.value }))}
                  placeholder="https://…/favicon.ico"
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="seo-canonical">Canonical domain (optional)</label>
                <input
                  id="seo-canonical"
                  value={form.canonicalDomain}
                  onChange={(e) => setForm((p) => ({ ...p, canonicalDomain: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="seo-indexing">Indexing</label>
                <select
                  id="seo-indexing"
                  value={form.indexingEnabled ? 'true' : 'false'}
                  onChange={(e) => setForm((p) => ({ ...p, indexingEnabled: e.target.value === 'true' }))}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="admin-form-field">
                <span className="admin-form-field__label">Robots defaults</span>
                <div className="admin-form-checks">
                  <label className="admin-form-check">
                    <input
                      type="checkbox"
                      checked={form.robotsIndex}
                      onChange={(e) => setForm((p) => ({ ...p, robotsIndex: e.target.checked }))}
                    />
                    index
                  </label>
                  <label className="admin-form-check">
                    <input
                      type="checkbox"
                      checked={form.robotsFollow}
                      onChange={(e) => setForm((p) => ({ ...p, robotsFollow: e.target.checked }))}
                    />
                    follow
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
