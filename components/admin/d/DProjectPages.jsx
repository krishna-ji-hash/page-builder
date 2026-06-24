'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PublicUrlActions from '@/components/admin/d/PublicUrlActions';
import PageSeoSettingsPanel from '@/components/admin/d/PageSeoSettingsPanel';
import { D_PROJECTS_PATH, dProjectMediaPath, dProjectMenusPath } from '@/lib/admin/dProjectRoutes';
import { buildPublicPreviewUrl } from '@/lib/admin/publicPreviewUrl';
import { dBuilderPagePath } from '@/lib/admin/dBuilderRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-pages.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

export default function DProjectPages({ projectId }) {
  const [project, setProject] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [newPage, setNewPage] = useState({ title: '', slug: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [busyPageId, setBusyPageId] = useState(null);
  const [seoPageId, setSeoPageId] = useState(null);

  const load = useCallback(async () => {
    const pid = String(projectId);
    setLoading(true);
    setError('');
    try {
      const [projectsRes, pagesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/projects', { cache: 'no-store' }),
        fetch(`/api/admin/projects/${pid}/pages`, { cache: 'no-store' }),
        fetch('/api/platform/site-settings', { cache: 'no-store' }),
      ]);
      const projectsData = await projectsRes.json().catch(() => ({}));
      const pagesData = await pagesRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!projectsRes.ok) throw new Error(projectsData?.error || 'Failed to load project');
      if (!pagesRes.ok) throw new Error(pagesData?.error || 'Failed to load pages');

      const found = (projectsData.projects || []).find((p) => String(p.id) === pid);
      if (!found) throw new Error('Project not found');
      setProject(found);
      setActiveProjectId(settingsData?.settings?.activeProjectId ?? null);
      setPages(Array.isArray(pagesData.pages) ? pagesData.pages : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reloadPages = async () => {
    const res = await fetch(`/api/admin/projects/${projectId}/pages`, { cache: 'no-store' });
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
      const res = await fetch(`/api/admin/projects/${projectId}/pages`, {
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

  const isActiveProject = project && Number(activeProjectId) === Number(project.id);
  const publicUrlOptions = useMemo(
    () => ({ isActiveProject: Boolean(isActiveProject) }),
    [isActiveProject]
  );

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !project) return pages;
    return pages.filter((page) => {
      const url = buildPublicPreviewUrl(project, page.slug, publicUrlOptions).toLowerCase();
      return page.title.toLowerCase().includes(q) || page.slug.toLowerCase().includes(q) || url.includes(q);
    });
  }, [pages, query, project, publicUrlOptions]);

  return (
    <div className="proj-pages">
      <div className="proj-pages__top">
        <Link className="project-new__back" href={D_PROJECTS_PATH}>
          ← All projects
        </Link>
      </div>

      {loading ? <p>Loading pages…</p> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && project ? (
        <>
          <header className="proj-pages__hero">
            <div className="proj-pages__hero-main">
              <p className="proj-pages__badge">Project · Pages</p>
              <h1 className="proj-pages__title">{project.name}</h1>
              <p className="proj-pages__sub">
                <code>{project.slug}</code>
                {project.domain ? (
                  <>
                    {' '}
                    · <code>{project.domain}</code>
                  </>
                ) : null}
              </p>
            </div>
            <div className="proj-pages__stats">
              <span className="proj-pages__pill">
                Total <strong>{pages.length}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--published">
                Live <strong>{publishedCount}</strong>
              </span>
              <span className="proj-pages__pill proj-pages__pill--draft">
                Drafts <strong>{draftCount}</strong>
              </span>
              <Link className="proj-pages__btn" href={dProjectMenusPath(project.id)}>
                Menus
              </Link>
              <Link className="proj-pages__btn" href={dProjectMediaPath(project.id)}>
                Media
              </Link>
            </div>
          </header>

          <section className="proj-pages__add" aria-labelledby="d-add-page-heading">
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
                  )}
                </code>
              </p>
            </form>
          </section>

          {!pages.length ? (
            <div className="proj-pages__empty">
              <p className="proj-pages__empty-title">No pages yet</p>
            </div>
          ) : (
            <ul className="proj-pages__list">
              {filteredPages.map((page) => {
                const published = page.status === 'published';
                const publicUrl = buildPublicPreviewUrl(project, page.slug, publicUrlOptions);
                return (
                  <li key={page.id} className="proj-pages__row">
                    <div className="proj-pages__card">
                    <span
                      className={`proj-pages__dot proj-pages__dot--${published ? 'published' : 'draft'}`}
                      aria-hidden="true"
                    />
                    <span className="proj-pages__name">{page.title}</span>
                    <code className="proj-pages__slug">{page.slug}</code>
                    <a
                      className="proj-pages__path"
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {publicUrl}
                    </a>
                    <span
                      className={`proj-pages__status proj-pages__status--${published ? 'published' : 'draft'}`}
                    >
                      {published ? 'Published' : 'Draft'}
                    </span>
                    <div className="proj-pages__actions">
                      <PublicUrlActions url={publicUrl} btnClassName="proj-pages__btn" />
                      <button
                        type="button"
                        className={`proj-pages__btn${seoPageId === page.id ? ' proj-pages__btn--active' : ''}`}
                        onClick={() => setSeoPageId((current) => (current === page.id ? null : page.id))}
                      >
                        SEO
                      </button>
                      <Link
                        className="proj-pages__btn proj-pages__btn--primary"
                        href={dBuilderPagePath(page.id)}
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
          )}
        </>
      ) : null}
    </div>
  );
}
