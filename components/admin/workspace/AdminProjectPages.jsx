'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import { publicPagePath } from '@/lib/publicSiteUrls';
import {
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_TITLE,
  isBlogPostTemplatePage,
} from '@/lib/blogPostTemplatePage.js';
import { adminFlatProjectSectionPath } from '@/lib/admin/adminRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-pages.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

export default function AdminProjectPages({ projectId }) {
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [newPage, setNewPage] = useState({ title: '', slug: '' });
  const [creating, setCreating] = useState(false);
  const [creatingBlogTemplate, setCreatingBlogTemplate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const addFormRef = useRef(null);

  useEffect(() => {
    const pid = Number(projectId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    setLoading(true);
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || 'Failed to load pages');
        return data;
      }),
    ])
      .then(([projectsData, pagesData]) => {
        const found = (projectsData.projects || []).find((p) => Number(p.id) === pid);
        if (!found) throw new Error('Project not found');
        setProject(found);
        setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (loading || !project) return;
    if (typeof window === 'undefined' || window.location.hash !== '#add-page') return;
    addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const titleInput = addFormRef.current?.querySelector('input[name="page-title"]');
    titleInput?.focus();
  }, [loading, project]);

  const reloadPages = async () => {
    const pid = Number(projectId);
    const pagesData = await fetch(`/api/projects/${pid}/pages`, { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : { pages: [] }
    );
    setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    const title = String(newPage.title || '').trim();
    const slug = normalizeBuilderSlug(newPage.slug) || slugFromTitle(title);
    if (!title || !slug) {
      setCreateError('Enter a page title and slug.');
      return;
    }

    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch(`/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create page');
      setNewPage({ title: '', slug: '' });
      setCreateSuccess(`"${title}" created — open the builder to design it.`);
      await reloadPages();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const unpublishPage = async (page) => {
    if (
      !window.confirm(
        `Unpublish "${page.title}" (${page.slug})? The live URL will go offline. The draft stays editable.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/pages/${page.id}/unpublish`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data?.error || 'Unpublish failed');
      return;
    }
    await reloadPages();
  };

  const publishedCount = pages.filter((p) => p.status === 'published').length;
  const draftCount = pages.length - publishedCount;
  const blogTemplatePage = pages.find((page) => isBlogPostTemplatePage(page)) || null;

  const handleEnsureBlogTemplate = async () => {
    setCreatingBlogTemplate(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await fetch(`/api/projects/${projectId}/pages/ensure-blog-template`, {
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

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(q) ||
        page.slug.toLowerCase().includes(q) ||
        (project && publicPagePath(project.slug, page.slug).toLowerCase().includes(q))
    );
  }, [pages, query, project]);

  return (
    <div className="proj-pages">
      {loading ? (
        <div className="proj-pages__skeleton" aria-hidden="true">
          <div className="proj-pages__skeleton-row" style={{ height: 120, marginBottom: 10 }} />
          <div className="proj-pages__skeleton-row" />
          <div className="proj-pages__skeleton-row" />
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && project ? (
        <>
          <header className="proj-pages__hero">
            <div className="proj-pages__hero-main">
              <p className="proj-pages__badge">Workspace · Pages</p>
              <h1 className="proj-pages__title">Pages</h1>
              <p className="proj-pages__sub">
                <strong>{project.name}</strong> — edit in builder, preview drafts, or open live URLs.
              </p>
            </div>
            <div className="proj-pages__stats" aria-label="Page counts">
              <span className="proj-pages__pill">
                Total <strong>{pages.length}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--published">
                Live <strong>{publishedCount}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--draft">
                Drafts <strong>{draftCount}</strong>
              </span>
            </div>
          </header>

          <section
            className="proj-pages__add"
            id="add-page"
            ref={addFormRef}
            aria-labelledby="proj-pages-add-heading"
          >
            <div className="proj-pages__add-head">
              <h2 id="proj-pages-add-heading" className="proj-pages__add-title">
                Add a page
              </h2>
              <p className="proj-pages__add-sub">
                New pages start as drafts. Design in the builder, then publish when ready.
              </p>
            </div>
            {createError ? (
              <p className="platform-alert platform-alert--error proj-pages__add-alert" role="alert">
                {createError}
              </p>
            ) : null}
            {createSuccess ? (
              <p className="proj-pages__add-success" role="status">
                {createSuccess}
              </p>
            ) : null}
            <form className="proj-pages__add-form" onSubmit={handleCreatePage}>
              <div className="proj-pages__add-row">
                <label className="proj-pages__field proj-pages__field--inline">
                  <span className="proj-pages__field-label">Title</span>
                  <input
                    className="proj-pages__input"
                    name="page-title"
                    placeholder="About us"
                    value={newPage.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setNewPage((prev) => ({
                        title: nextTitle,
                        slug: prev.slug && prev.slug !== slugFromTitle(prev.title) ? prev.slug : slugFromTitle(nextTitle),
                      }));
                    }}
                    disabled={creating}
                    required
                  />
                </label>
                <label className="proj-pages__field proj-pages__field--inline">
                  <span className="proj-pages__field-label">Slug</span>
                  <input
                    className="proj-pages__input"
                    name="page-slug"
                    placeholder="about-us"
                    value={newPage.slug}
                    onChange={(e) =>
                      setNewPage((prev) => ({
                        ...prev,
                        slug: normalizeBuilderSlug(e.target.value),
                      }))
                    }
                    disabled={creating}
                    required
                  />
                </label>
                <button className="proj-pages__btn proj-pages__btn--primary" type="submit" disabled={creating}>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                  {creating ? 'Adding…' : 'Add page'}
                </button>
              </div>
              {project ? (
                <p className="proj-pages__add-preview">
                  <span className="proj-pages__add-preview-label">URL preview</span>
                  <code>
                    {publicPagePath(
                      project.slug,
                      normalizeBuilderSlug(newPage.slug) || slugFromTitle(newPage.title) || 'page-slug'
                    )}
                  </code>
                </p>
              ) : null}
            </form>
          </section>

          <section className="proj-pages__template" aria-labelledby="proj-pages-blog-posts-heading">
            <div className="proj-pages__add-head">
              <h2 id="proj-pages-blog-posts-heading" className="proj-pages__add-title">
                Blog posts
              </h2>
              <p className="proj-pages__add-sub">
                Add and publish articles dynamically from the dashboard. Published posts appear on your{' '}
                <strong>blog</strong> listing and at <code>/blog/[slug]</code>.
              </p>
            </div>
            <div className="proj-pages__template-card">
              <div>
                <p className="proj-pages__template-name">Dynamic blog manager</p>
                <p className="proj-pages__template-meta">
                  Create unlimited posts with title, content, images, categories, and SEO — no builder edits required.
                </p>
              </div>
              <div className="proj-pages__template-actions">
                <Link className="proj-pages__btn proj-pages__btn--primary" href={adminFlatProjectSectionPath('blog')}>
                  Manage blog posts
                </Link>
              </div>
            </div>
          </section>

          <section className="proj-pages__template" aria-labelledby="proj-pages-blog-template-heading">
            <div className="proj-pages__add-head">
              <h2 id="proj-pages-blog-template-heading" className="proj-pages__add-title">
                Blog article template
              </h2>
              <p className="proj-pages__add-sub">
                Design how individual blog articles look at <code>/blog/[slug]</code>. This is separate
                from your <strong>blog</strong> listing page.
              </p>
            </div>
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
                      href={adminBuilderPagePath(project.slug, BLOG_POST_TEMPLATE_SLUG)}
                    >
                      Open builder
                    </Link>
                    <Link
                      className="proj-pages__btn"
                      href={previewPagePath(project.slug, BLOG_POST_TEMPLATE_SLUG)}
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

          {!pages.length ? (
            <div className="proj-pages__empty">
              <p className="proj-pages__empty-title">No pages yet</p>
              <p className="proj-pages__empty-text">
                Use the form above to create your first page, then open the builder to design it.
              </p>
            </div>
          ) : (
            <div className="proj-pages__board">
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
                  <span className="proj-pages__count">
                    {query.trim()
                      ? `${filteredPages.length} of ${pages.length}`
                      : `${pages.length} page${pages.length === 1 ? '' : 's'}`}
                  </span>
                </label>
              </div>

              {query.trim() && !filteredPages.length ? (
                <p className="proj-pages__no-results">No pages match &ldquo;{query.trim()}&rdquo;.</p>
              ) : null}

              {filteredPages.length ? (
                <ul className="proj-pages__list">
                  {filteredPages.map((page) => {
                    const published = page.status === 'published';
                    const isBlogTemplate = isBlogPostTemplatePage(page);
                    const livePath = isBlogTemplate
                      ? '/blog/[article-slug]'
                      : publicPagePath(project.slug, page.slug);
                    return (
                      <li
                        key={page.id}
                        className={`proj-pages__card${isBlogTemplate ? ' proj-pages__card--template' : ''}`}
                      >
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
                        <span className="proj-pages__path">{livePath}</span>
                        <span className={`proj-pages__status proj-pages__status--${published ? 'published' : 'draft'}`}>
                          {published ? 'Published' : 'Draft'}
                        </span>
                        <div className="proj-pages__actions">
                          <Link
                            className="proj-pages__btn proj-pages__btn--primary"
                            href={adminBuilderPagePath(project.slug, page.slug)}
                          >
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                            </svg>
                            Edit
                          </Link>
                          <Link
                            className="proj-pages__btn"
                            href={previewPagePath(project.slug, page.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.4" />
                              <path d="M2.5 8s2-3.5 5.5-3.5S13.5 8 13.5 8s-2 3.5-5.5 3.5S2.5 8 2.5 8z" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                            Preview
                          </Link>
                          {published && !isBlogTemplate ? (
                            <Link
                              className="proj-pages__btn"
                              href={livePath}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M6 3.5h6.5V10M6 10L10.5 5.5 6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Live
                            </Link>
                          ) : null}
                          {published && isBlogTemplate ? (
                            <Link
                              className="proj-pages__btn"
                              href="/blog/what-is-logistics-aggregator"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M6 3.5h6.5V10M6 10L10.5 5.5 6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Sample article
                            </Link>
                          ) : null}
                          {published ? (
                            <button
                              type="button"
                              className="proj-pages__btn proj-pages__btn--danger"
                              onClick={() => unpublishPage(page)}
                            >
                              Unpublish
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
