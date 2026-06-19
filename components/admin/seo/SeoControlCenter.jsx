'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SeoDefaultsForm from '@/components/admin/seo/SeoDefaultsForm';
import SeoPageEditorModal from '@/components/admin/seo/SeoPageEditorModal';
import EnterpriseSeoSuite from '@/components/admin/seo/EnterpriseSeoSuite';
import LlmSeoPanel from '@/components/admin/seo/LlmSeoPanel';
import AiSeoAutomation from '@/components/admin/seo/AiSeoAutomation';
import {
  IndexingBadge,
  ScoreBadge,
  pageSeoFormFromApi,
  pageSeoToPayload,
  SeoSection,
  SeoField,
  SchemaTypeSelect,
  TITLE_TARGET,
  DESC_TARGET,
  charCountClass,
} from '@/components/admin/seo/seoFormFields';
import {
  SEO_TABS,
  EMPTY_DEFAULTS,
  GLOBAL_SCHEMA_KEYS,
  PAGE_SCHEMA_KEYS,
  ScoreRing,
  IssueList,
  SerpPreview,
  SocialCardPreview,
  defaultsToPayload,
  fetchJson,
  seoFromApi,
} from '@/components/admin/seo/seoShared';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-seo.css';
import '@/styles/admin/seo-hub.css';
import '@/styles/admin/seo-control-center.css';

const DEFAULT_SCHEMA_TEMPLATE = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '{{siteTitle}}',
  url: '{{url}}',
  logo: '{{image}}',
};

const REDIRECT_TYPES = [
  {
    value: '301',
    label: '301 — Permanent (final)',
    short: 'Permanent',
    hint: 'Final redirect — old URL permanently moved. Use for slug changes, HTTPS, or domain moves. Google passes SEO value to the new URL.',
  },
  {
    value: '302',
    label: '302 — Temporary',
    short: 'Temporary',
    hint: 'Temporary redirect — old URL may return later. Use for maintenance, campaigns, or short-term tests. Google keeps the old URL as primary.',
  },
];

export default function SeoControlCenter({ projectId }) {
  const [tab, setTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [form, setForm] = useState(EMPTY_DEFAULTS);
  const [overview, setOverview] = useState(null);
  const [pages, setPages] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [audit, setAudit] = useState(null);
  const [sitemap, setSitemap] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogSeoForm, setBlogSeoForm] = useState({});
  const [socialTarget, setSocialTarget] = useState('page');
  const [socialPageId, setSocialPageId] = useState(null);
  const [redirectForm, setRedirectForm] = useState({ sourcePath: '', destinationPath: '', redirectType: '301', active: true });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadBase = useCallback(async () => {
    const pid = Number(projectId);
    const [seoData, projectsData, dashData] = await Promise.all([
      fetchJson(`/api/projects/${projectId}/seo`, { cache: 'no-store' }),
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetchJson(`/api/projects/${projectId}/seo/dashboard`, { cache: 'no-store' }),
    ]);
    setProject((projectsData.projects || []).find((p) => Number(p.id) === pid) || null);
    setForm(seoFromApi(seoData?.seo || {}));
    setOverview(dashData.dashboard || null);
  }, [projectId]);

  const loadPages = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/pages`, { cache: 'no-store' });
    setPages(data.pages || []);
  }, [projectId]);

  const loadBlog = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/blog`, { cache: 'no-store' });
    setBlogPosts(data.posts || []);
  }, [projectId]);

  const loadAudit = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/audit`, { cache: 'no-store' });
    setAudit(data.audit || null);
  }, [projectId]);

  const loadSitemap = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/sitemap`, { cache: 'no-store' });
    setSitemap(data.sitemap || null);
  }, [projectId]);

  const loadRedirects = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/redirects`, { cache: 'no-store' });
    setRedirects(data.redirects || []);
  }, [projectId]);

  const loadChecklist = useCallback(async () => {
    const data = await fetchJson(`/api/projects/${projectId}/seo/search-console`, { cache: 'no-store' });
    setChecklist(data.checklist || null);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadBase()
      .catch((e) => setError(e?.message || 'Failed to load SEO'))
      .finally(() => setLoading(false));
  }, [loadBase]);

  useEffect(() => {
    setError('');
    if (tab === 'pages' || tab === 'social' || tab === 'ai') {
      loadPages().catch((e) => setError(e?.message || 'Pages failed'));
      if (tab === 'social') loadBlog().catch(() => {});
    }
    if (tab === 'blog') loadBlog().catch((e) => setError(e?.message || 'Blog failed'));
    if (tab === 'audit' || tab === 'overview') loadAudit().catch(() => {});
    if (tab === 'sitemap' || tab === 'overview') loadSitemap().catch(() => {});
    if (tab === 'redirects') loadRedirects().catch((e) => setError(e?.message || 'Redirects failed'));
    if (tab === 'search-console') {
      loadChecklist().catch((e) => setError(e?.message || 'Checklist failed'));
    }
  }, [tab, loadPages, loadBlog, loadAudit, loadSitemap, loadRedirects, loadChecklist]);

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
      await loadBase();
    } catch (e) {
      setError(e?.message || 'Failed to save defaults');
    } finally {
      setBusy(false);
    }
  };

  const saveRobots = async () => {
    await saveDefaults();
  };

  const openPageEditor = (page) => setEditingPage(page);

  const openBlogEditor = (post, presetSchema) => {
    setEditingBlog(post);
    setBlogSeoForm(
      pageSeoFormFromApi({
        ...post.seo,
        title: post.seo?.title || post.seoTitle || post.title,
        description: post.seo?.description || post.metaDescription || '',
        focusKeyword: post.focusKeyword || '',
        schemaType: presetSchema || post.schemaType || 'BlogPosting',
      })
    );
  };

  const savePageSeo = async (pageId, patch) => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: patch }),
      });
      await loadPages();
      await loadAudit().catch(() => {});
      if (editingPage?.id === pageId) setEditingPage(null);
    } catch (e) {
      setError(e?.message || 'Failed to save page SEO');
    } finally {
      setBusy(false);
    }
  };

  const saveBlogSeo = async (itemId) => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/blog/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: pageSeoToPayload(blogSeoForm) }),
      });
      await loadBlog();
      setEditingBlog(null);
    } catch (e) {
      setError(e?.message || 'Failed to save blog SEO');
    } finally {
      setBusy(false);
    }
  };

  const runBulkFix = async (type) => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, type }),
      });
      await loadPages();
      await loadAudit();
      await loadBase();
    } catch (e) {
      setError(e?.message || 'Bulk fix failed');
    } finally {
      setBusy(false);
    }
  };

  const applyQuickFix = async (fix) => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: fix.type, pageId: fix.pageId }),
      });
      await loadPages();
      await loadAudit();
    } catch (e) {
      setError(e?.message || 'Quick fix failed');
    } finally {
      setBusy(false);
    }
  };

  const createRedirect = async () => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/redirects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redirectForm),
      });
      setRedirectForm({ sourcePath: '', destinationPath: '', redirectType: '301', active: true });
      await loadRedirects();
    } catch (e) {
      setError(e?.message || 'Failed to create redirect');
    } finally {
      setBusy(false);
    }
  };

  const deleteRedirect = async (id) => {
    setBusy(true);
    try {
      await fetchJson(`/api/projects/${projectId}/seo/redirects/${id}`, { method: 'DELETE' });
      await loadRedirects();
    } catch (e) {
      setError(e?.message || 'Failed to delete redirect');
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

  const robotsPreview = useMemo(() => {
    const lines = ['User-agent: *'];
    if (!form.indexingEnabled || form.robotsMode === 'disallow_all') lines.push('Disallow: /');
    else if (form.robotsMode === 'custom') {
      lines.push('Allow: /');
      for (const rule of form.robotsDisallowPaths.split('\n').map((s) => s.trim()).filter(Boolean)) {
        lines.push(`Disallow: ${rule.startsWith('/') ? rule : `/${rule}`}`);
      }
    } else lines.push('Allow: /');
    if (form.crawlDelay) lines.push(`Crawl-delay: ${form.crawlDelay}`);
    if (project?.slug) lines.push(`Sitemap: https://${form.canonicalDomain?.replace(/^https?:\/\//, '') || 'example.com'}/${project.slug}/sitemap.xml`);
    return lines.join('\n');
  }, [form, project?.slug]);

  const socialPreview = useMemo(() => {
    const page = pages.find((p) => p.id === socialPageId) || pages[0];
    const post = blogPosts.find((p) => p.id === socialPageId) || blogPosts[0];
    const target = socialTarget === 'blog' && post ? post : page;
    if (!target) return { title: '', description: '', image: form.defaultOgImage, url: '' };
    return {
      title: target.seoTitle || target.title,
      description: target.metaDescription || form.defaultDescription,
      image: target.ogImage || form.defaultOgImage,
      url: target.livePath || '',
    };
  }, [socialTarget, socialPageId, pages, blogPosts, form]);

  const getSchemaEntry = (key) => form.schemaTemplates?.[key] || { enabled: false, template: DEFAULT_SCHEMA_TEMPLATE };

  const updateSchemaTemplate = (key, patch) => {
    setForm((prev) => ({
      ...prev,
      schemaTemplates: {
        ...prev.schemaTemplates,
        [key]: { ...getSchemaEntry(key), ...patch },
      },
    }));
  };

  return (
    <div className="proj-seo seo-hub seo-cc">
      <header className="proj-seo__hero">
        <div className="proj-seo__hero-main">
          <p className="proj-seo__badge">Unified SEO Control Center</p>
          <h1 className="proj-seo__title">SEO management</h1>
          <p className="proj-seo__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — central hub for project defaults, pages, blog, schema, sitemap,
                robots, redirects, and audits. Builder SEO modal stays synced via the same APIs.
              </>
            ) : (
              'Central SEO hub for your project.'
            )}
          </p>
        </div>
        <div className="proj-seo__hero-actions">
          {tab === 'defaults' || tab === 'schema' || tab === 'robots' ? (
            <button type="button" className={`proj-seo__save${saved ? ' proj-seo__save--saved' : ''}`} onClick={tab === 'robots' ? saveRobots : saveDefaults} disabled={busy || loading}>
              {busy ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="seo-cc__tabs-scroll">
        <nav className="seo-hub__tabs seo-cc__tabs" aria-label="SEO sections">
          {SEO_TABS.map((t) => (
            <button key={t.id} type="button" className={`seo-hub__tab${tab === t.id ? ' seo-hub__tab--active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? <div className="proj-seo__skeleton" aria-hidden="true" /> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && tab === 'overview' && overview ? (
        <section className="seo-cc__panel">
          <div className="seo-hub__scores">
            <ScoreRing score={overview.overallScore} label="Overall SEO" />
            <ScoreRing score={overview.dashboard?.schemaCoverage ?? overview.schemaCoverage} label="Schema %" />
          </div>
          <div className="seo-cc__stat-grid">
            <div className="seo-hub__widget"><h3>Published pages</h3><p className="seo-hub__stat">{overview.publishedPages} / {overview.totalPages}</p></div>
            <div className="seo-hub__widget"><h3>Missing title</h3><p className="seo-hub__stat">{overview.missingTitle}</p></div>
            <div className="seo-hub__widget"><h3>Missing description</h3><p className="seo-hub__stat">{overview.missingDescription}</p></div>
            <div className="seo-hub__widget"><h3>Missing OG image</h3><p className="seo-hub__stat">{overview.missingOgImage}</p></div>
            <div className="seo-hub__widget"><h3>Missing canonical</h3><p className="seo-hub__stat">{overview.missingCanonical}</p></div>
            <div className="seo-hub__widget"><h3>noindex pages</h3><p className="seo-hub__stat">{overview.noindexPages}</p></div>
            <div className="seo-hub__widget"><h3>Sitemap</h3><p className={`seo-hub__status seo-hub__status--${overview.sitemapStatus === 'ready' ? 'enabled' : 'disabled'}`}>{overview.sitemapStatus} ({overview.sitemapUrlCount} URLs)</p></div>
            <div className="seo-hub__widget"><h3>Robots</h3><p className={`seo-hub__status seo-hub__status--${overview.robotsStatus === 'allowed' ? 'enabled' : 'disabled'}`}>{overview.robotsStatus}</p></div>
            <div className="seo-hub__widget"><h3>Broken links</h3><p className="seo-hub__stat">{overview.brokenLinksCount}</p></div>
            <div className="seo-hub__widget"><h3>Missing alt</h3><p className="seo-hub__stat">{overview.missingAltCount}</p></div>
          </div>
          <div className="seo-cc__actions">
            <button type="button" className="proj-seo__save" onClick={() => runBulkFix('generate-title-from-h1')} disabled={busy}>Fix missing titles</button>
            <button type="button" className="proj-seo__save" onClick={() => runBulkFix('generate-description-from-paragraph')} disabled={busy}>Fix missing descriptions</button>
            <button type="button" className="proj-seo__save" onClick={() => { loadSitemap(); setTab('sitemap'); }} disabled={busy}>Generate sitemap</button>
            <button type="button" className="proj-seo__save" onClick={() => setTab('audit')} disabled={busy}>Open audit</button>
            {overview.sitemapPublicPath ? (
              <a className="proj-seo__save seo-cc__link-btn" href={overview.sitemapPublicPath} target="_blank" rel="noreferrer">View live sitemap</a>
            ) : null}
            {project?.slug ? (
              <a className="proj-seo__save seo-cc__link-btn" href={`/${project.slug}/robots.txt`} target="_blank" rel="noreferrer">View robots.txt</a>
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && tab === 'defaults' ? <SeoDefaultsForm form={form} setForm={setForm} /> : null}

      {!loading && tab === 'pages' ? (
        <section className="seo-cc__panel">
          <p className="proj-seo__hint seo-cc__panel-intro">
            Quick-edit title and description inline, or open the full editor for OG, Twitter, schema, and indexing.
          </p>
          <div className="seo-cc__table-wrap">
            <table className="seo-cc__table">
              <thead>
                <tr>
                  <th>Page</th><th>Slug</th><th>Status</th><th>SEO title</th><th>Description</th><th>Score</th><th>Index</th><th>Schema</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr><td colSpan={9} className="seo-hub__empty">No pages yet. Create pages in the builder.</td></tr>
                ) : pages.map((page) => (
                  <tr key={page.id}>
                    <td>{page.title}</td>
                    <td><code>/{page.slug}</code></td>
                    <td><span className={`seo-cc__badge${page.status === 'published' ? ' seo-cc__badge--good' : ''}`}>{page.status}</span></td>
                    <td><input className="seo-cc__inline-input" value={page.seoTitle} onChange={(e) => setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, seoTitle: e.target.value } : p)))} onBlur={() => savePageSeo(page.id, { title: page.seoTitle })} /></td>
                    <td><input className="seo-cc__inline-input" value={page.metaDescription} onChange={(e) => setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, metaDescription: e.target.value } : p)))} onBlur={() => savePageSeo(page.id, { description: page.metaDescription })} /></td>
                    <td><ScoreBadge score={page.seoScore} /></td>
                    <td><IndexingBadge status={page.indexingStatus} /></td>
                    <td>{page.schemaType || '—'}</td>
                    <td className="seo-cc__row-actions">
                      <button type="button" onClick={() => openPageEditor(page)}>Edit SEO</button>
                      <Link href={page.builderPath}>Builder</Link>
                      {page.status === 'published' ? <a href={page.livePath} target="_blank" rel="noreferrer">Live</a> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && tab === 'blog' ? (
        <section className="seo-cc__panel">
          {blogPosts.length === 0 ? <p className="seo-hub__empty">No blog posts in CMS collection &quot;blog&quot;.</p> : (
            <div className="seo-cc__table-wrap">
              <table className="seo-cc__table">
                <thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Category</th><th>SEO title</th><th>Score</th><th>Schema</th><th>Actions</th></tr></thead>
                <tbody>
                  {blogPosts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.title}</td>
                      <td><code>{post.slug}</code></td>
                      <td>{post.status}</td>
                      <td>{post.category || '—'}</td>
                      <td>{post.seoTitle}</td>
                      <td>{post.seoScore}</td>
                      <td>{post.schemaType}</td>
                      <td className="seo-cc__row-actions">
                        <button type="button" onClick={() => openBlogEditor(post)}>Edit SEO</button>
                        <button type="button" onClick={() => openBlogEditor(post, 'BlogPosting')}>Article schema</button>
                        {post.status === 'published' ? <a href={post.livePath} target="_blank" rel="noreferrer">Open</a> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {editingBlog ? (
            <div className="seo-cc__blog-editor">
              <header className="seo-cc__blog-editor-head">
                <div>
                  <h2>Blog SEO — {editingBlog.title}</h2>
                  <p className="seo-cc__modal-sub"><code>{editingBlog.slug}</code></p>
                </div>
                <div className="seo-cc__modal-actions">
                  <button type="button" className="proj-seo__save proj-seo__save--ghost" onClick={() => setEditingBlog(null)}>Close</button>
                  <button type="button" className="proj-seo__save" onClick={() => saveBlogSeo(editingBlog.id)} disabled={busy}>Save blog SEO</button>
                </div>
              </header>
              <div className="seo-cc__blog-editor-body">
                <div className="seo-cc__blog-editor-main">
                  <SeoSection title="Search metadata">
                    <div className="proj-seo__section-body">
                      <SeoField
                        label="SEO title"
                        full
                        counter={{
                          className: charCountClass(String(blogSeoForm.title || '').length, TITLE_TARGET),
                          text: `${String(blogSeoForm.title || '').length} / ${TITLE_TARGET.max}`,
                        }}
                      >
                        <input className="seo-cc__input" value={blogSeoForm.title || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, title: e.target.value }))} />
                      </SeoField>
                      <SeoField
                        label="Meta description"
                        full
                        counter={{
                          className: charCountClass(String(blogSeoForm.description || '').length, DESC_TARGET),
                          text: `${String(blogSeoForm.description || '').length} / ${DESC_TARGET.max}`,
                        }}
                      >
                        <textarea className="seo-cc__input" rows={3} value={blogSeoForm.description || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, description: e.target.value }))} />
                      </SeoField>
                      <div className="proj-seo__section-body--grid">
                        <SeoField label="Focus keyword">
                          <input className="seo-cc__input" value={blogSeoForm.focusKeyword || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, focusKeyword: e.target.value }))} />
                        </SeoField>
                        <SeoField label="Keywords" hint="Comma-separated">
                          <input className="seo-cc__input" value={blogSeoForm.keywords || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, keywords: e.target.value }))} />
                        </SeoField>
                        <SeoField label="Canonical URL" full>
                          <input className="seo-cc__input" value={blogSeoForm.canonicalUrl || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, canonicalUrl: e.target.value }))} />
                        </SeoField>
                        <SeoField label="Schema type">
                          <SchemaTypeSelect value={blogSeoForm.schemaType} onChange={(v) => setBlogSeoForm((p) => ({ ...p, schemaType: v }))} />
                        </SeoField>
                      </div>
                    </div>
                  </SeoSection>
                  <SeoSection title="Open Graph & Twitter">
                    <div className="proj-seo__section-body proj-seo__section-body--grid">
                      <SeoField label="OG title"><input className="seo-cc__input" value={blogSeoForm.ogTitle || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, ogTitle: e.target.value }))} /></SeoField>
                      <SeoField label="OG image"><input className="seo-cc__input" value={blogSeoForm.ogImage || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, ogImage: e.target.value }))} /></SeoField>
                      <SeoField label="OG description" full><textarea className="seo-cc__input" rows={2} value={blogSeoForm.ogDescription || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, ogDescription: e.target.value }))} /></SeoField>
                      <SeoField label="Twitter card">
                        <select className="seo-cc__input" value={blogSeoForm.twitterCard || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, twitterCard: e.target.value }))}>
                          <option value="">(project default)</option>
                          <option value="summary">summary</option>
                          <option value="summary_large_image">summary_large_image</option>
                        </select>
                      </SeoField>
                      <SeoField label="Twitter title"><input className="seo-cc__input" value={blogSeoForm.twitterTitle || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, twitterTitle: e.target.value }))} /></SeoField>
                      <SeoField label="Twitter image" full><input className="seo-cc__input" value={blogSeoForm.twitterImage || ''} onChange={(e) => setBlogSeoForm((p) => ({ ...p, twitterImage: e.target.value }))} /></SeoField>
                    </div>
                  </SeoSection>
                  <SeoSection title="Indexing">
                    <div className="proj-seo__checks">
                      <label className="proj-seo__check"><input type="checkbox" checked={blogSeoForm.noindex} onChange={(e) => setBlogSeoForm((p) => ({ ...p, noindex: e.target.checked }))} /> noindex</label>
                      <label className="proj-seo__check"><input type="checkbox" checked={blogSeoForm.nofollow} onChange={(e) => setBlogSeoForm((p) => ({ ...p, nofollow: e.target.checked }))} /> nofollow</label>
                      <label className="proj-seo__check"><input type="checkbox" checked={blogSeoForm.sitemapExclude} onChange={(e) => setBlogSeoForm((p) => ({ ...p, sitemapExclude: e.target.checked }))} /> exclude from sitemap</label>
                    </div>
                  </SeoSection>
                </div>
                <aside className="seo-cc__blog-editor-aside">
                  <SerpPreview title={blogSeoForm.title} description={blogSeoForm.description} url={`${form.canonicalDomain || ''}${editingBlog.livePath || ''}`} />
                  <SocialCardPreview network="facebook" title={blogSeoForm.ogTitle || blogSeoForm.title} description={blogSeoForm.ogDescription || blogSeoForm.description} image={blogSeoForm.ogImage || form.defaultOgImage} />
                </aside>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && tab === 'schema' ? (
        <section className="seo-cc__panel">
          <h2>Global schemas</h2>
          <div className="seo-cc__schema-grid">
            {GLOBAL_SCHEMA_KEYS.map((key) => {
              const entry = getSchemaEntry(key);
              return (
                <div key={key} className="seo-hub__widget">
                  <label className="proj-seo__check"><input type="checkbox" checked={entry.enabled} onChange={(e) => updateSchemaTemplate(key, { enabled: e.target.checked, template: entry.template || { ...DEFAULT_SCHEMA_TEMPLATE, '@type': key } })} /> {key}</label>
                  <textarea className="seo-cc__schema-json" rows={6} value={JSON.stringify(entry.template || DEFAULT_SCHEMA_TEMPLATE, null, 2)} onChange={(e) => { try { updateSchemaTemplate(key, { template: JSON.parse(e.target.value) }); } catch { /* invalid json while typing */ } }} />
                </div>
              );
            })}
          </div>
          <h2>Page schema types</h2>
          <p className="proj-seo__hint">Set per-page via Pages tab. Supported: {PAGE_SCHEMA_KEYS.join(', ')}. Tokens: {'{{siteTitle}}'}, {'{{title}}'}, {'{{description}}'}, {'{{url}}'}, {'{{image}}'}, {'{{item.title}}'}, {'{{item.data.*}}'}</p>
        </section>
      ) : null}

      {!loading && tab === 'sitemap' ? (
        <section className="seo-cc__panel seo-hub__sitemap">
          <div className="seo-hub__sitemap-actions">
            <button type="button" className="proj-seo__save" onClick={loadSitemap} disabled={busy}>Refresh</button>
            <button type="button" className="proj-seo__save" onClick={downloadSitemap} disabled={!sitemap?.xml}>Download</button>
            {sitemap?.publicPath ? <a className="proj-seo__save seo-cc__link-btn" href={sitemap.publicPath} target="_blank" rel="noreferrer">Open live</a> : null}
          </div>
          {sitemap ? (
            <>
              <p className="seo-hub__stat">{sitemap.urlCount} URLs · Published pages + blog/CMS items</p>
              <div className="seo-cc__table-wrap"><table className="seo-cc__table"><thead><tr><th>URL</th><th>Kind</th><th>Last mod</th></tr></thead><tbody>{(sitemap.urls || []).map((u) => <tr key={u.loc}><td>{u.loc}</td><td>{u.kind}</td><td>{u.lastmod || '—'}</td></tr>)}</tbody></table></div>
              <pre className="seo-hub__sitemap-xml">{sitemap.xml}</pre>
            </>
          ) : <p className="seo-hub__empty">Loading sitemap…</p>}
        </section>
      ) : null}

      {!loading && tab === 'robots' ? (
        <section className="seo-cc__panel seo-cc__robots">
          <SeoSection title="robots.txt rules" subtitle="Controls crawler access for the live site. Save with the button in the header.">
            <div className="proj-seo__section-body proj-seo__section-body--grid">
              <SeoField label="Mode">
                <select className="seo-cc__input" value={form.robotsMode} onChange={(e) => setForm((p) => ({ ...p, robotsMode: e.target.value }))}>
                  <option value="allow_all">Allow all</option>
                  <option value="disallow_all">Disallow all</option>
                  <option value="custom">Custom disallow rules</option>
                </select>
              </SeoField>
              <SeoField label="Crawl delay (seconds)" hint="Optional delay between requests.">
                <input className="seo-cc__input" type="number" min="0" value={form.crawlDelay} onChange={(e) => setForm((p) => ({ ...p, crawlDelay: e.target.value }))} />
              </SeoField>
              <SeoField label="Custom disallow paths" hint="One path per line, e.g. /admin or /preview" full>
                <textarea className="seo-cc__input" rows={5} value={form.robotsDisallowPaths} onChange={(e) => setForm((p) => ({ ...p, robotsDisallowPaths: e.target.value }))} placeholder="/admin&#10;/preview" disabled={form.robotsMode !== 'custom'} />
              </SeoField>
            </div>
          </SeoSection>
          <SeoSection title="Meta robots (project default)" subtitle="Also editable under Project Defaults → Indexing.">
            <div className="proj-seo__checks">
              <label className="proj-seo__check"><input type="checkbox" checked={form.robotsIndex} onChange={(e) => setForm((p) => ({ ...p, robotsIndex: e.target.checked }))} /> index</label>
              <label className="proj-seo__check"><input type="checkbox" checked={form.robotsFollow} onChange={(e) => setForm((p) => ({ ...p, robotsFollow: e.target.checked }))} /> follow</label>
            </div>
          </SeoSection>
          <div>
            <h3 className="seo-cc__preview-label">Live robots.txt preview</h3>
            <pre className="seo-cc__robots-preview">{robotsPreview}</pre>
            {project?.slug ? (
              <a className="proj-seo__save seo-cc__link-btn" href={`/${project.slug}/robots.txt`} target="_blank" rel="noreferrer">Open live robots.txt</a>
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && tab === 'redirects' ? (
        <section className="seo-cc__panel seo-cc__redirects">
          <div className="seo-cc__redirect-card">
            <div className="seo-cc__redirect-card-head">
              <h3 className="seo-cc__redirect-title">Add redirect</h3>
              <p className="proj-seo__hint seo-cc__redirect-intro">
                Send visitors from an old URL to a new one. Use <strong>301</strong> when the move is final; use{' '}
                <strong>302</strong> only for short-term redirects.
              </p>
            </div>

            <div className="seo-cc__redirect-form-row">
              <label className="seo-cc__redirect-field">
                <span className="seo-cc__redirect-label">Source</span>
                <input
                  className="seo-cc__input"
                  placeholder="/old-page"
                  value={redirectForm.sourcePath}
                  onChange={(e) => setRedirectForm((p) => ({ ...p, sourcePath: e.target.value }))}
                />
              </label>
              <label className="seo-cc__redirect-field">
                <span className="seo-cc__redirect-label">Destination</span>
                <input
                  className="seo-cc__input"
                  placeholder="/new-page"
                  value={redirectForm.destinationPath}
                  onChange={(e) => setRedirectForm((p) => ({ ...p, destinationPath: e.target.value }))}
                />
              </label>
              <label className="seo-cc__redirect-field seo-cc__redirect-field--type">
                <span className="seo-cc__redirect-label">Redirect type</span>
                <select
                  className="seo-cc__input seo-ai__select"
                  value={redirectForm.redirectType}
                  onChange={(e) => setRedirectForm((p) => ({ ...p, redirectType: e.target.value }))}
                >
                  {REDIRECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="proj-seo__save seo-cc__redirect-submit" onClick={createRedirect} disabled={busy}>
                Add redirect
              </button>
            </div>
            <p className="seo-cc__redirect-type-hint">
              {REDIRECT_TYPES.find((t) => t.value === redirectForm.redirectType)?.hint}
            </p>
          </div>

          <div className="seo-cc__redirect-list-head">
            <h3 className="seo-cc__redirect-title">Active redirects</h3>
            <span className="proj-seo__hint">{redirects.length} total</span>
          </div>

          <div className="seo-cc__table-wrap">
            <table className="seo-cc__table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Type</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="seo-cc__redirect-empty">
                      No redirects yet. Add your first redirect above.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => {
                    const typeMeta = REDIRECT_TYPES.find((t) => t.value === String(r.redirectType));
                    return (
                      <tr key={r.id}>
                        <td>
                          <code className="seo-cc__redirect-path">{r.sourcePath}</code>
                        </td>
                        <td>
                          <code className="seo-cc__redirect-path">{r.destinationPath}</code>
                        </td>
                        <td>
                          <span
                            className={`seo-cc__redirect-badge seo-cc__redirect-badge--${r.redirectType === '302' ? 'temp' : 'perm'}`}
                            title={typeMeta?.hint}
                          >
                            {r.redirectType} · {typeMeta?.short || r.redirectType}
                          </span>
                        </td>
                        <td>
                          <span className={`seo-cc__redirect-status${r.active ? ' seo-cc__redirect-status--on' : ''}`}>
                            {r.active ? 'Active' : 'Off'}
                          </span>
                        </td>
                        <td className="seo-cc__redirect-delete-cell">
                          <button type="button" className="seo-cc__redirect-delete" onClick={() => deleteRedirect(r.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && tab === 'audit' && audit ? (
        <section className="seo-cc__panel seo-hub__audit">
          <div className="seo-hub__audit-summary">
            <ScoreRing score={audit.score} label="Project score" />
            <p>{audit.summary?.critical || 0} critical · {audit.summary?.warning || 0} warnings</p>
          </div>
          <div className="seo-cc__actions">
            {(audit.quickFixes || []).slice(0, 8).map((fix) => (
              <button key={`${fix.type}-${fix.pageId}`} type="button" className="proj-seo__save" onClick={() => applyQuickFix(fix)} disabled={busy}>
                {fix.type} ({fix.pageSlug})
              </button>
            ))}
          </div>
          <div className="seo-hub__audit-grid">
            {audit.pages?.map((p) => <div key={p.pageName} className="seo-hub__audit-card"><h3>{p.pageName} <span>{p.score}/100</span></h3><IssueList issues={p.issues} /></div>)}
            {audit.blogs?.map((b) => <div key={b.pageName} className="seo-hub__audit-card"><h3>{b.pageName} <span>{b.score}/100</span></h3><IssueList issues={b.issues} /></div>)}
          </div>
          {(audit.issues || []).length ? <div className="seo-cc__extended-issues"><h3>Extended checks</h3><IssueList issues={audit.issues} /></div> : null}
        </section>
      ) : null}

      {!loading && tab === 'enterprise' ? <EnterpriseSeoSuite projectId={projectId} /> : null}

      {!loading && tab === 'llm' ? <LlmSeoPanel projectId={projectId} /> : null}

      {!loading && tab === 'ai' ? <AiSeoAutomation projectId={projectId} pages={pages} /> : null}

      {!loading && tab === 'social' ? (
        <section className="seo-cc__panel">
          <div className="seo-cc__social-controls">
            <select value={socialTarget} onChange={(e) => setSocialTarget(e.target.value)}><option value="page">Page</option><option value="blog">Blog post</option></select>
            <select value={socialPageId || ''} onChange={(e) => setSocialPageId(Number(e.target.value) || null)}>
              {(socialTarget === 'blog' ? blogPosts : pages).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <button type="button" className="proj-seo__save" onClick={() => { if (socialTarget === 'blog') loadBlog(); else loadPages(); }}>Refresh list</button>
          </div>
          <div className="seo-cc__social-grid">
            <div><h3>Google SERP</h3><SerpPreview {...socialPreview} url={`${form.canonicalDomain || 'https://example.com'}${socialPreview.url}`} /></div>
            <SocialCardPreview network="facebook" {...socialPreview} />
            <SocialCardPreview network="twitter" {...socialPreview} />
            <SocialCardPreview network="linkedin" {...socialPreview} />
          </div>
        </section>
      ) : null}

      {!loading && tab === 'search-console' && checklist ? (
        <section className="seo-cc__panel">
          <ScoreRing score={checklist.readyScore} label="Ready score" />
          <ul className="seo-cc__checklist">
            {checklist.items?.map((item) => (
              <li key={item.id} className={`seo-cc__check seo-cc__check--${item.status}`}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
          <div className="seo-hub__widget seo-cc__future">
            <h3>Google Search Console API (planned)</h3>
            <p>Future metrics: {checklist.futureIntegrations?.googleSearchConsole?.metrics?.join(', ')}</p>
          </div>
        </section>
      ) : null}

      {editingPage ? (
        <SeoPageEditorModal
          page={editingPage}
          projectId={projectId}
          canonicalDomain={form.canonicalDomain}
          onClose={() => setEditingPage(null)}
          onSaved={() => {
            loadPages().catch(() => {});
            loadAudit().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}
