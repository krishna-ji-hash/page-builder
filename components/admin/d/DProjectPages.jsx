'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProjectWorkspaceChrome from '@/components/admin/workspace/ProjectWorkspaceChrome';
import PublicUrlActions from '@/components/admin/d/PublicUrlActions';
import PageSeoSettingsPanel from '@/components/admin/d/PageSeoSettingsPanel';
import { buildPublicPreviewUrl } from '@/lib/admin/publicPreviewUrl';
import { dBuilderPagePath, dPreviewPagePath } from '@/lib/admin/dBuilderRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import {
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_TITLE,
  isBlogPostTemplatePage,
} from '@/lib/blogPostTemplatePage.js';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-pages.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

export default function DProjectPages({
  projectId,
  initialProject = null,
  activeProjectId: initialActiveProjectId = null,
  activeProjectSlug: initialActiveProjectSlug = null,
}) {
  const pid = Number(projectId);
  const addFormRef = useRef(null);
  const [project, setProject] = useState(initialProject);
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [activeProjectSlug, setActiveProjectSlug] = useState(initialActiveProjectSlug);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [newPage, setNewPage] = useState({ title: '', slug: '' });
  const [creating, setCreating] = useState(false);
  const [creatingBlogTemplate, setCreatingBlogTemplate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [busyPageId, setBusyPageId] = useState(null);
  const [seoPageId, setSeoPageId] = useState(null);
  /** Absolute origin only after mount — avoids SSR/client URL mismatch. */
  const [previewOrigin, setPreviewOrigin] = useState('');

  useEffect(() => {
    setPreviewOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Invalid project.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [projectsRes, pagesRes, settingsRes] = await Promise.all([
        fetch('/api/projects', { cache: 'no-store' }),
        fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }),
        fetch('/api/platform/site-settings', { cache: 'no-store' }),
      ]);
      const projectsData = await projectsRes.json().catch(() => ({}));
      const pagesData = await pagesRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load project');
      if (!pagesRes.ok) throw new Error(pagesData?.error || 'Failed to load pages');

      const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
      if (!found) throw new Error('Project not found');
      setProject(found);

      const activeId = settingsData?.settings?.activeProjectId ?? null;
      setActiveProjectId(activeId);
      if (activeId != null) {
        const active = (projectsData.projects || []).find((p) => Number(p.id) === Number(activeId));
        setActiveProjectSlug(active?.slug ?? null);
      }

      setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !project) return;
    if (typeof window === 'undefined' || window.location.hash !== '#add-page') return;
    addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const titleInput = addFormRef.current?.querySelector('input[name="page-title"]');
    titleInput?.focus();
  }, [loading, project]);

  const reloadPages = async () => {
    const res = await fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPages(Array.isArray(data.pages) ? data.pages : []);
  };

  const handleCreatePage = async (event) => {
    event.preventDefault();
    const title = String(newPage.title || '').trim();
    const slug = normalizeBuilderSlug(newPage.slug) || slugFromTitle(title);
    if (!title || !slug) {
      setCreateError('Enter a page title and slug.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch(`/api/projects/${pid}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create page');
      setNewPage({ title: '', slug: '' });
      await reloadPages();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const publishPage = async (page) => {
    if (!window.confirm(`Publish "${page.title}" to the live site?`)) return;
    setBusyPageId(page.id);
    try {
      const res = await fetch(`/api/admin/pages/${page.id}/publish`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Publish failed');
      await reloadPages();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyPageId(null);
    }
  };

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;
  const blogTemplatePage = pages.find((page) => isBlogPostTemplatePage(page)) || null;

  const handleEnsureBlogTemplate = async () => {
    setCreatingBlogTemplate(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch(`/api/projects/${pid}/pages/ensure-blog-template`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create blog article template');
      setCreateSuccess(
        data.created
          ? `"${BLOG_POST_TEMPLATE_TITLE}" created — open builder to style article pages.`
          : `"${BLOG_POST_TEMPLATE_TITLE}" is ready — open builder to edit article styling.`
      );
      await reloadPages();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingBlogTemplate(false);
    }
  };

  const isActiveProject = project && Number(activeProjectId) === Number(project.id);
  const publicUrlOptions = useMemo(
    () => ({
      isActiveProject: Boolean(isActiveProject),
      ...(previewOrigin ? { origin: previewOrigin } : {}),
    }),
    [isActiveProject, previewOrigin]
  );

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !project) return pages;
    return pages.filter((page) => {
      const url = buildPublicPreviewUrl(project, page.slug, publicUrlOptions);
      const hay = `${page.title} ${page.slug} ${url || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pages, query, project, publicUrlOptions]);

  return (
    <ProjectWorkspaceChrome
      project={project}
      activeProjectId={activeProjectId}
      activeProjectSlug={activeProjectSlug}
      section="pages"
      loading={loading}
      error={error}
      stats={
        project ? (
          <>
            <span className="proj-workspace__pill">
              Total <strong>{pages.length}</strong>
            </span>
            <span className="proj-workspace__pill proj-workspace__pill--published">
              Live <strong>{publishedCount}</strong>
            </span>
            <span className="proj-workspace__pill proj-workspace__pill--draft">
              Drafts <strong>{draftCount}</strong>
            </span>
          </>
        ) : null
      }
    >
      {!loading && project ? (
        <>
          <section id="add-page" ref={addFormRef} className="proj-pages__add" aria-labelledby="d-add-page-heading">
            <div className="proj-pages__add-head">
              <h2 id="d-add-page-heading" className="proj-pages__add-title">
                Create page
              </h2>
            </div>
            {createError ? (
              <p className="platform-alert platform-alert--error" role="alert">
                {createError}
              </p>
            ) : null}
            <form className="proj-pages__add-form" onSubmit={handleCreatePage}>
              <div className="proj-pages__add-row">
                <label className="proj-pages__field proj-pages__field--inline">
                  <span className="proj-pages__field-label">Title</span>
                  <input
                    className="proj-pages__input"
                    name="page-title"
                    value={newPage.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setNewPage((prev) => ({
                        title: nextTitle,
                        slug:
                          prev.slug && prev.slug !== slugFromTitle(prev.title)
                            ? prev.slug
                            : slugFromTitle(nextTitle),
                      }));
                    }}
                    placeholder="About"
                    required
                    disabled={creating}
                  />
                </label>
                <label className="proj-pages__field proj-pages__field--inline">
                  <span className="proj-pages__field-label">Slug</span>
                  <input
                    className="proj-pages__input"
                    value={newPage.slug}
                    onChange={(e) =>
                      setNewPage((prev) => ({ ...prev, slug: normalizeBuilderSlug(e.target.value) }))
                    }
                    placeholder="about"
                    required
                    disabled={creating}
                  />
                </label>
                <button className="proj-pages__btn proj-pages__btn--primary" type="submit" disabled={creating}>
                  {creating ? 'Creating…' : 'Create page'}
                </button>
              </div>
              <p className="proj-pages__add-preview">
                <span className="proj-pages__add-preview-label">Public URL preview</span>
                <code>
                  {buildPublicPreviewUrl(
                    project,
                    normalizeBuilderSlug(newPage.slug) || slugFromTitle(newPage.title) || 'page-slug',
                    publicUrlOptions
                  ) || '—'}
                </code>
              </p>
            </form>
          </section>

          <section className="proj-pages__template" aria-labelledby="d-blog-template-heading">
            <div className="proj-pages__add-head">
              <h2 id="d-blog-template-heading" className="proj-pages__add-title">
                Blog article template
              </h2>
              <p className="proj-pages__add-sub">
                Design how individual blog articles look at <code>/blog/[slug]</code>. This is separate
                from your <strong>blog</strong> listing page.
              </p>
            </div>
            {createSuccess ? (
              <p className="proj-pages__add-success" role="status">
                {createSuccess}
              </p>
            ) : null}
            <div className="proj-pages__template-card">
              <div>
                <p className="proj-pages__template-name">{BLOG_POST_TEMPLATE_TITLE}</p>
                <p className="proj-pages__template-meta">
                  Slug: <code>{BLOG_POST_TEMPLATE_SLUG}</code> · Powers live URLs like{' '}
                  <code>/blog/what-is-logistics-aggregator</code>
                </p>
                {blogTemplatePage ? (
                  <p className="proj-pages__template-status">
                    Status:{' '}
                    <strong>{blogTemplatePage.status === 'published' ? 'Published' : 'Draft'}</strong>
                    {blogTemplatePage.status !== 'published'
                      ? ' — publish after styling so live articles use your design.'
                      : ' — live articles use this design.'}
                  </p>
                ) : null}
              </div>
              <div className="proj-pages__template-actions">
                {blogTemplatePage ? (
                  <>
                    <Link
                      className="proj-pages__btn proj-pages__btn--primary"
                      href={dBuilderPagePath(blogTemplatePage.id, project.slug, BLOG_POST_TEMPLATE_SLUG, {
                        id: activeProjectId,
                        slug: activeProjectSlug,
                      })}
                    >
                      Open builder
                    </Link>
                    <Link
                      className="proj-pages__btn"
                      href={dPreviewPagePath(blogTemplatePage.id, project.slug, BLOG_POST_TEMPLATE_SLUG)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview template
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    className="proj-pages__btn proj-pages__btn--primary"
                    onClick={handleEnsureBlogTemplate}
                    disabled={creatingBlogTemplate}
                  >
                    {creatingBlogTemplate ? 'Creating…' : 'Create blog article template'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {pages.length ? (
            <div className="proj-pages__toolbar">
              <label className="proj-pages__search">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages…"
                  aria-label="Search pages"
                />
              </label>
              <span className="proj-pages__count">
                {filteredPages.length} of {pages.length} page{pages.length === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}

          {!pages.length ? (
            <div className="proj-pages__empty">
              <p className="proj-pages__empty-title">No pages yet</p>
              <p className="proj-pages__empty-text">Create your first page above, then open the builder to design it.</p>
            </div>
          ) : filteredPages.length ? (
            <ul className="proj-pages__list">
              {filteredPages.map((page) => {
                const published = page.status === 'published';
                const isBlogTemplate = isBlogPostTemplatePage(page);
                const publicUrl = isBlogTemplate
                  ? null
                  : buildPublicPreviewUrl(project, page.slug, publicUrlOptions);
                return (
                  <li key={page.id} className="proj-pages__row">
                    <div className={`proj-pages__card${isBlogTemplate ? ' proj-pages__card--template' : ''}`}>
                      <span
                        className={`proj-pages__dot proj-pages__dot--${published ? 'published' : 'draft'}`}
                        aria-hidden="true"
                      />
                      <span className="proj-pages__name">
                        {page.title}
                        {isBlogTemplate ? (
                          <span className="proj-pages__template-badge">Article template</span>
                        ) : null}
                      </span>
                      <code className="proj-pages__slug">{page.slug}</code>
                      {isBlogTemplate ? (
                        <span className="proj-pages__path proj-pages__path--muted">/blog/[article-slug]</span>
                      ) : publicUrl ? (
                        <a
                          className="proj-pages__path"
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {publicUrl}
                        </a>
                      ) : (
                        <span className="proj-pages__path proj-pages__path--muted">No public URL yet</span>
                      )}
                      <span
                        className={`proj-pages__status proj-pages__status--${published ? 'published' : 'draft'}`}
                      >
                        {published ? 'Published' : 'Draft'}
                      </span>
                      <div className="proj-pages__actions">
                        {publicUrl ? <PublicUrlActions url={publicUrl} btnClassName="proj-pages__btn" /> : null}
                        <button
                          type="button"
                          className={`proj-pages__btn${seoPageId === page.id ? ' proj-pages__btn--active' : ''}`}
                          onClick={() => setSeoPageId((current) => (current === page.id ? null : page.id))}
                        >
                          SEO
                        </button>
                        <Link
                          className="proj-pages__btn proj-pages__btn--primary"
                          href={dBuilderPagePath(page.id, project?.slug, page.slug, {
                            id: activeProjectId,
                            slug: activeProjectSlug,
                          })}
                        >
                          Open builder
                        </Link>
                        {!published ? (
                          <button
                            type="button"
                            className="proj-pages__btn"
                            disabled={busyPageId === page.id}
                            onClick={() => publishPage(page)}
                          >
                            Publish
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {seoPageId === page.id ? (
                      <PageSeoSettingsPanel
                        pageId={page.id}
                        pageTitle={page.title}
                        onClose={() => setSeoPageId(null)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="proj-pages__no-results">No pages match your search.</p>
          )}
        </>
      ) : null}
    </ProjectWorkspaceChrome>
  );
}
