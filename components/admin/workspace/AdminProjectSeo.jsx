'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEO_SCHEMA_TYPES } from '@/lib/seo/seoConstants';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-seo.css';
import '@/styles/admin/seo-hub.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'defaults', label: 'Defaults' },
  { id: 'pages', label: 'Pages' },
  { id: 'audit', label: 'Audit' },
  { id: 'sitemap', label: 'Sitemap' },
];

const EMPTY_DEFAULTS = {
  siteTitle: '',
  siteName: '',
  siteTagline: '',
  companyName: '',
  defaultAuthor: '',
  defaultPublisher: '',
  language: 'en',
  country: '',
  titleTemplate: '{{title}} | {{siteTitle}}',
  defaultMetaTitle: '',
  defaultDescription: '',
  defaultKeywords: '',
  defaultOgImage: '',
  defaultOgTitle: '',
  defaultOgDescription: '',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  twitterCreator: '',
  favicon: '',
  canonicalDomain: '',
  indexingEnabled: true,
  robotsIndex: true,
  robotsFollow: true,
  maxImagePreview: 'large',
  maxSnippet: -1,
  maxVideoPreview: -1,
};

function previewTitle(template, siteTitle, pageTitle = 'Home') {
  const tpl = template || '{{title}} | {{siteTitle}}';
  const site = siteTitle || 'My Company';
  return tpl.replace(/\{\{title\}\}/g, pageTitle).replace(/\{\{siteTitle\}\}/g, site);
}

function seoFromApi(seo = {}) {
  return {
    ...EMPTY_DEFAULTS,
    siteTitle: seo.siteTitle || seo.siteName || '',
    siteName: seo.siteName || seo.siteTitle || '',
    siteTagline: seo.siteTagline || '',
    companyName: seo.companyName || '',
    defaultAuthor: seo.defaultAuthor || '',
    defaultPublisher: seo.defaultPublisher || '',
    language: seo.language || 'en',
    country: seo.country || '',
    titleTemplate: seo.titleTemplate || EMPTY_DEFAULTS.titleTemplate,
    defaultMetaTitle: seo.defaultMetaTitle || '',
    defaultDescription: seo.defaultDescription || '',
    defaultKeywords: Array.isArray(seo.defaultKeywords) ? seo.defaultKeywords.join(', ') : seo.defaultKeywords || '',
    defaultOgImage: seo.defaultOgImage || '',
    defaultOgTitle: seo.defaultOgTitle || '',
    defaultOgDescription: seo.defaultOgDescription || '',
    twitterCard: seo.twitterCard || 'summary_large_image',
    twitterSite: seo.twitterSite || '',
    twitterCreator: seo.twitterCreator || '',
    favicon: seo.favicon || '',
    canonicalDomain: seo.canonicalDomain || '',
    indexingEnabled: seo.indexingEnabled !== false,
    robotsIndex: seo.robots?.index !== false,
    robotsFollow: seo.robots?.follow !== false,
    maxImagePreview: seo.robots?.googleBot?.['max-image-preview'] || 'large',
    maxSnippet: seo.robots?.googleBot?.['max-snippet'] ?? -1,
    maxVideoPreview: seo.robots?.googleBot?.['max-video-preview'] ?? -1,
  };
}

function defaultsToPayload(form) {
  const googleBot = {};
  if (form.maxImagePreview) googleBot['max-image-preview'] = form.maxImagePreview;
  if (form.maxSnippet != null && form.maxSnippet !== '' && Number(form.maxSnippet) >= 0) {
    googleBot['max-snippet'] = Number(form.maxSnippet);
  }
  if (form.maxVideoPreview != null && form.maxVideoPreview !== '' && Number(form.maxVideoPreview) >= 0) {
    googleBot['max-video-preview'] = Number(form.maxVideoPreview);
  }
  return {
    siteTitle: form.siteTitle,
    siteName: form.siteName || form.siteTitle,
    siteTagline: form.siteTagline,
    companyName: form.companyName,
    defaultAuthor: form.defaultAuthor,
    defaultPublisher: form.defaultPublisher,
    language: form.language,
    country: form.country,
    titleTemplate: form.titleTemplate,
    defaultMetaTitle: form.defaultMetaTitle,
    defaultDescription: form.defaultDescription,
    defaultKeywords: form.defaultKeywords
      .split(/[,;]+/)
      .map((k) => k.trim())
      .filter(Boolean),
    defaultOgImage: form.defaultOgImage,
    defaultOgTitle: form.defaultOgTitle,
    defaultOgDescription: form.defaultOgDescription,
    twitterCard: form.twitterCard,
    twitterSite: form.twitterSite,
    twitterCreator: form.twitterCreator,
    favicon: form.favicon,
    canonicalDomain: form.canonicalDomain,
    indexingEnabled: Boolean(form.indexingEnabled),
    robots: {
      index: Boolean(form.robotsIndex),
      follow: Boolean(form.robotsFollow),
      ...(Object.keys(googleBot).length ? { googleBot } : {}),
    },
  };
}

function ScoreRing({ score, label }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const color = pct >= 80 ? 'var(--ps-good)' : pct >= 50 ? 'var(--ps-warn)' : '#e07a7a';
  return (
    <div className="seo-hub__score-card">
      <div className="seo-hub__score-ring" style={{ '--score': pct, '--score-color': color }}>
        <span>{pct}</span>
      </div>
      <span className="seo-hub__score-label">{label}</span>
    </div>
  );
}

function IssueList({ issues }) {
  if (!issues?.length) return <p className="seo-hub__empty">All checks passed.</p>;
  return (
    <ul className="seo-hub__issues">
      {issues.map((issue) => (
        <li key={issue.id} className={`seo-hub__issue seo-hub__issue--${issue.severity}`}>
          <span>{issue.label}</span>
          <span className="seo-hub__issue-badge">{issue.severity}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminProjectSeo({ projectId }) {
  const [tab, setTab] = useState('dashboard');
  const [project, setProject] = useState(null);
  const [form, setForm] = useState(EMPTY_DEFAULTS);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [pageSeoForm, setPageSeoForm] = useState({});
  const [audit, setAudit] = useState(null);
  const [sitemap, setSitemap] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadBase = useCallback(async () => {
    const pid = Number(projectId);
    const [seoData, projectsData, pagesData] = await Promise.all([
      fetchJson(`/api/projects/${projectId}/seo`, { cache: 'no-store' }),
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetchJson(`/api/projects/${projectId}/pages`, { cache: 'no-store' }),
    ]);
    setProject((projectsData.projects || []).find((p) => Number(p.id) === pid) || null);
    setForm(seoFromApi(seoData?.seo || {}));
    setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadBase()
      .catch((e) => setError(e?.message || 'Failed to load SEO'))
      .finally(() => setLoading(false));
  }, [loadBase]);

  const loadAudit = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/audit`, { cache: 'no-store' });
    setAudit(data.audit || null);
  }, [projectId]);

  const loadSitemap = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/sitemap`, { cache: 'no-store' });
    setSitemap(data.sitemap || null);
  }, [projectId]);

  useEffect(() => {
    if (tab === 'dashboard' || tab === 'audit') {
      loadAudit().catch((e) => setError(e?.message || 'Audit failed'));
    }
    if (tab === 'sitemap') {
      loadSitemap().catch((e) => setError(e?.message || 'Sitemap failed'));
    }
  }, [tab, loadAudit, loadSitemap]);

  const openPageSeo = async (page) => {
    setActivePageId(page.id);
    setBusy(true);
    try {
      const data = await fetchJson(`/api/pages/${page.id}/seo`, { cache: 'no-store' });
      const seo = data?.seo || {};
      setPageSeoForm({
        title: seo.title || '',
        description: seo.description || '',
        keywords: Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords || '',
        focusKeyword: seo.focusKeyword || '',
        canonicalUrl: seo.canonicalUrl || '',
        ogTitle: seo.ogTitle || '',
        ogDescription: seo.ogDescription || '',
        ogImage: seo.ogImage || '',
        twitterTitle: seo.twitterTitle || '',
        twitterDescription: seo.twitterDescription || '',
        twitterImage: seo.twitterImage || '',
        twitterCard: seo.twitterCard || '',
        schemaType: seo.schemaType || '',
        noindex: Boolean(seo.noindex),
        nofollow: Boolean(seo.nofollow),
      });
    } catch (e) {
      setError(e?.message || 'Failed to load page SEO');
    } finally {
      setBusy(false);
    }
  };

  const saveDefaults = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await fetchJson(`/api/projects/${projectId}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: defaultsToPayload(form) }),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.message || 'Failed to save SEO defaults');
    } finally {
      setBusy(false);
    }
  };

  const savePageSeo = async () => {
    if (!activePageId) return;
    setBusy(true);
    try {
      await fetchJson(`/api/pages/${activePageId}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo: {
            ...pageSeoForm,
            keywords: pageSeoForm.keywords
              .split(/[,;]+/)
              .map((k) => k.trim())
              .filter(Boolean),
          },
        }),
      });
      await loadAudit().catch(() => {});
    } catch (e) {
      setError(e?.message || 'Failed to save page SEO');
    } finally {
      setBusy(false);
    }
  };

  const downloadSitemap = () => {
    if (!sitemap?.xml) return;
    const blob = new Blob([sitemap.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-${project?.slug || projectId}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const preview = useMemo(
    () => ({
      title: previewTitle(form.titleTemplate, form.siteTitle),
      description: form.defaultDescription.trim() || 'Add a meta description to improve click-through from search results.',
    }),
    [form.titleTemplate, form.siteTitle, form.defaultDescription]
  );

  const dash = audit?.dashboard;

  return (
    <div className="proj-seo seo-hub">
      <header className="proj-seo__hero">
        <div className="proj-seo__hero-main">
          <p className="proj-seo__badge">Enterprise SEO Suite</p>
          <h1 className="proj-seo__title">SEO management</h1>
          <p className="proj-seo__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — defaults, per-page SEO, audits, schema, and sitemap. Page-level SEO
                overrides project defaults.
              </>
            ) : (
              'Project defaults, per-page SEO, audits, schema, and sitemap.'
            )}
          </p>
        </div>
        <div className="proj-seo__hero-actions">
          {tab === 'defaults' ? (
            <button
              type="button"
              className={`proj-seo__save${saved ? ' proj-seo__save--saved' : ''}`}
              onClick={saveDefaults}
              disabled={busy || loading}
            >
              {busy ? 'Saving…' : saved ? 'Saved' : 'Save defaults'}
            </button>
          ) : null}
        </div>
      </header>

      <nav className="seo-hub__tabs" aria-label="SEO sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`seo-hub__tab${tab === t.id ? ' seo-hub__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? <div className="proj-seo__skeleton" aria-hidden="true" /> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && tab === 'dashboard' && dash ? (
        <section className="seo-hub__dashboard">
          <div className="seo-hub__scores">
            <ScoreRing score={dash.overallScore} label="Overall SEO" />
            <ScoreRing score={dash.pagesSeo} label="Pages" />
            <ScoreRing score={dash.blogSeo} label="Blog" />
            <ScoreRing score={dash.schemaCoverage} label="Schema %" />
          </div>
          <div className="seo-hub__widgets">
            <div className="seo-hub__widget">
              <h3>Indexing</h3>
              <p className={`seo-hub__status seo-hub__status--${dash.indexingStatus}`}>{dash.indexingStatus}</p>
            </div>
            <div className="seo-hub__widget">
              <h3>Missing metadata</h3>
              <p className="seo-hub__stat">{dash.missingMetadata} pages/posts</p>
            </div>
            <div className="seo-hub__widget">
              <h3>Issues</h3>
              <p className="seo-hub__stat">
                <span className="seo-hub__critical">{audit?.summary?.critical || 0} critical</span>
                {' · '}
                <span className="seo-hub__warning">{audit?.summary?.warning || 0} warnings</span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && tab === 'defaults' ? (
        <div className="proj-seo__layout">
          <div className="proj-seo__form">
            <section className="proj-seo__section">
              <div className="proj-seo__section-head">
                <h2 className="proj-seo__section-title">Site identity</h2>
              </div>
              <div className="proj-seo__section-body proj-seo__section-body--grid">
                <div className="proj-seo__field">
                  <label>Site name</label>
                  <input value={form.siteName} onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value, siteTitle: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Site tagline</label>
                  <input value={form.siteTagline} onChange={(e) => setForm((p) => ({ ...p, siteTagline: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Company name</label>
                  <input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Default author</label>
                  <input value={form.defaultAuthor} onChange={(e) => setForm((p) => ({ ...p, defaultAuthor: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Default publisher</label>
                  <input value={form.defaultPublisher} onChange={(e) => setForm((p) => ({ ...p, defaultPublisher: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Language</label>
                  <input value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} placeholder="en" />
                </div>
                <div className="proj-seo__field">
                  <label>Country</label>
                  <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="US" />
                </div>
              </div>
            </section>

            <section className="proj-seo__section">
              <div className="proj-seo__section-head">
                <h2 className="proj-seo__section-title">Metadata defaults</h2>
              </div>
              <div className="proj-seo__section-body">
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Default title template</label>
                  <input value={form.titleTemplate} onChange={(e) => setForm((p) => ({ ...p, titleTemplate: e.target.value }))} />
                  <p className="proj-seo__hint">
                    <code>{'{{title}}'}</code>, <code>{'{{siteTitle}}'}</code>, <code>{'{{slug}}'}</code>,{' '}
                    <code>{'{{category}}'}</code>
                  </p>
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Default meta description</label>
                  <textarea rows={3} value={form.defaultDescription} onChange={(e) => setForm((p) => ({ ...p, defaultDescription: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Default keywords</label>
                  <input value={form.defaultKeywords} onChange={(e) => setForm((p) => ({ ...p, defaultKeywords: e.target.value }))} placeholder="keyword one, keyword two" />
                </div>
              </div>
            </section>

            <section className="proj-seo__section">
              <div className="proj-seo__section-head">
                <h2 className="proj-seo__section-title">Social SEO</h2>
              </div>
              <div className="proj-seo__section-body proj-seo__section-body--grid">
                <div className="proj-seo__field">
                  <label>Default OG title</label>
                  <input value={form.defaultOgTitle} onChange={(e) => setForm((p) => ({ ...p, defaultOgTitle: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Default OG image</label>
                  <input value={form.defaultOgImage} onChange={(e) => setForm((p) => ({ ...p, defaultOgImage: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Default OG description</label>
                  <textarea rows={2} value={form.defaultOgDescription} onChange={(e) => setForm((p) => ({ ...p, defaultOgDescription: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Twitter card</label>
                  <select value={form.twitterCard} onChange={(e) => setForm((p) => ({ ...p, twitterCard: e.target.value }))}>
                    <option value="summary">summary</option>
                    <option value="summary_large_image">summary_large_image</option>
                  </select>
                </div>
                <div className="proj-seo__field">
                  <label>Twitter site</label>
                  <input value={form.twitterSite} onChange={(e) => setForm((p) => ({ ...p, twitterSite: e.target.value }))} placeholder="@brand" />
                </div>
                <div className="proj-seo__field">
                  <label>Twitter creator</label>
                  <input value={form.twitterCreator} onChange={(e) => setForm((p) => ({ ...p, twitterCreator: e.target.value }))} placeholder="@author" />
                </div>
                <div className="proj-seo__field">
                  <label>Favicon URL</label>
                  <input value={form.favicon} onChange={(e) => setForm((p) => ({ ...p, favicon: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Canonical domain</label>
                  <input value={form.canonicalDomain} onChange={(e) => setForm((p) => ({ ...p, canonicalDomain: e.target.value }))} placeholder="https://example.com" />
                </div>
              </div>
            </section>

            <section className="proj-seo__section">
              <div className="proj-seo__section-head">
                <h2 className="proj-seo__section-title">Robots & indexing</h2>
              </div>
              <div className="proj-seo__section-body proj-seo__section-body--grid">
                <div className="proj-seo__field">
                  <label>Indexing</label>
                  <select value={form.indexingEnabled ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, indexingEnabled: e.target.value === 'true' }))}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="proj-seo__field">
                  <span className="proj-seo__field-label">Robots</span>
                  <div className="proj-seo__checks">
                    <label className="proj-seo__check">
                      <input type="checkbox" checked={form.robotsIndex} onChange={(e) => setForm((p) => ({ ...p, robotsIndex: e.target.checked }))} />
                      index
                    </label>
                    <label className="proj-seo__check">
                      <input type="checkbox" checked={form.robotsFollow} onChange={(e) => setForm((p) => ({ ...p, robotsFollow: e.target.checked }))} />
                      follow
                    </label>
                  </div>
                </div>
                <div className="proj-seo__field">
                  <label>max-image-preview</label>
                  <select value={form.maxImagePreview} onChange={(e) => setForm((p) => ({ ...p, maxImagePreview: e.target.value }))}>
                    <option value="large">large</option>
                    <option value="standard">standard</option>
                    <option value="none">none</option>
                  </select>
                </div>
                <div className="proj-seo__field">
                  <label>max-snippet</label>
                  <input type="number" value={form.maxSnippet} onChange={(e) => setForm((p) => ({ ...p, maxSnippet: e.target.value }))} placeholder="-1" />
                </div>
                <div className="proj-seo__field">
                  <label>max-video-preview</label>
                  <input type="number" value={form.maxVideoPreview} onChange={(e) => setForm((p) => ({ ...p, maxVideoPreview: e.target.value }))} placeholder="-1" />
                </div>
              </div>
            </section>
          </div>

          <aside className="proj-seo__aside">
            <div className="proj-seo__preview">
              <div className="proj-seo__preview-head">
                <h2 className="proj-seo__preview-title">Live preview</h2>
              </div>
              <div className="proj-seo__preview-body">
                <div className="proj-seo__serp">
                  <span className="proj-seo__serp-title">{preview.title}</span>
                  <p className="proj-seo__serp-desc">{preview.description}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {!loading && tab === 'pages' ? (
        <div className="seo-hub__pages">
          <div className="seo-hub__page-list">
            <h2>Pages</h2>
            <ul>
              {pages.map((page) => (
                <li key={page.id}>
                  <button type="button" className={activePageId === page.id ? 'is-active' : ''} onClick={() => openPageSeo(page)}>
                    <strong>{page.title}</strong>
                    <span>/{page.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {activePageId ? (
            <div className="seo-hub__page-editor">
              <h2>Page SEO</h2>
              <div className="proj-seo__section-body">
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Meta title</label>
                  <input value={pageSeoForm.title} onChange={(e) => setPageSeoForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Meta description</label>
                  <textarea rows={3} value={pageSeoForm.description} onChange={(e) => setPageSeoForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Keywords</label>
                  <input value={pageSeoForm.keywords} onChange={(e) => setPageSeoForm((p) => ({ ...p, keywords: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Focus keyword</label>
                  <input value={pageSeoForm.focusKeyword} onChange={(e) => setPageSeoForm((p) => ({ ...p, focusKeyword: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Canonical URL</label>
                  <input value={pageSeoForm.canonicalUrl} onChange={(e) => setPageSeoForm((p) => ({ ...p, canonicalUrl: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>OG title</label>
                  <input value={pageSeoForm.ogTitle} onChange={(e) => setPageSeoForm((p) => ({ ...p, ogTitle: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>OG image</label>
                  <input value={pageSeoForm.ogImage} onChange={(e) => setPageSeoForm((p) => ({ ...p, ogImage: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>OG description</label>
                  <textarea rows={2} value={pageSeoForm.ogDescription} onChange={(e) => setPageSeoForm((p) => ({ ...p, ogDescription: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Twitter title</label>
                  <input value={pageSeoForm.twitterTitle} onChange={(e) => setPageSeoForm((p) => ({ ...p, twitterTitle: e.target.value }))} />
                </div>
                <div className="proj-seo__field">
                  <label>Twitter image</label>
                  <input value={pageSeoForm.twitterImage} onChange={(e) => setPageSeoForm((p) => ({ ...p, twitterImage: e.target.value }))} />
                </div>
                <div className="proj-seo__field proj-seo__field--full">
                  <label>Schema type</label>
                  <select value={pageSeoForm.schemaType} onChange={(e) => setPageSeoForm((p) => ({ ...p, schemaType: e.target.value }))}>
                    <option value="">(auto / none)</option>
                    {SEO_SCHEMA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="proj-seo__checks">
                  <label className="proj-seo__check">
                    <input type="checkbox" checked={pageSeoForm.noindex} onChange={(e) => setPageSeoForm((p) => ({ ...p, noindex: e.target.checked }))} />
                    noindex
                  </label>
                  <label className="proj-seo__check">
                    <input type="checkbox" checked={pageSeoForm.nofollow} onChange={(e) => setPageSeoForm((p) => ({ ...p, nofollow: e.target.checked }))} />
                    nofollow
                  </label>
                </div>
                <button type="button" className="proj-seo__save" onClick={savePageSeo} disabled={busy}>
                  Save page SEO
                </button>
              </div>
            </div>
          ) : (
            <p className="seo-hub__empty">Select a page to edit SEO.</p>
          )}
        </div>
      ) : null}

      {!loading && tab === 'audit' && audit ? (
        <div className="seo-hub__audit">
          <div className="seo-hub__audit-summary">
            <ScoreRing score={audit.score} label="Project score" />
            <p>
              {audit.summary.critical} critical · {audit.summary.warning} warnings
            </p>
          </div>
          <div className="seo-hub__audit-grid">
            {audit.pages?.map((pageAudit) => (
              <div key={pageAudit.pageName} className="seo-hub__audit-card">
                <h3>
                  {pageAudit.pageName} <span>{pageAudit.score}/100</span>
                </h3>
                <IssueList issues={pageAudit.issues} />
              </div>
            ))}
            {audit.blogs?.map((blogAudit) => (
              <div key={blogAudit.pageName} className="seo-hub__audit-card">
                <h3>
                  {blogAudit.pageName} <span>{blogAudit.score}/100</span>
                </h3>
                <IssueList issues={blogAudit.issues} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && tab === 'sitemap' ? (
        <div className="seo-hub__sitemap">
          <div className="seo-hub__sitemap-actions">
            <button type="button" className="proj-seo__save" onClick={() => loadSitemap()} disabled={busy}>
              Refresh preview
            </button>
            <button type="button" className="proj-seo__save" onClick={downloadSitemap} disabled={!sitemap?.xml}>
              Download sitemap
            </button>
            {sitemap?.publicPath ? (
              <span className="seo-hub__sitemap-path">
                Live: <code>/{project?.slug}{sitemap.publicPath.replace(`/${project?.slug}`, '')}</code>
              </span>
            ) : null}
          </div>
          {sitemap ? (
            <>
              <p className="seo-hub__stat">{sitemap.urlCount} URLs in sitemap</p>
              <pre className="seo-hub__sitemap-xml">{sitemap.xml}</pre>
            </>
          ) : (
            <p className="seo-hub__empty">Loading sitemap…</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
