'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminBuilderPagePath, previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { publicPagePath } from '@/lib/publicSiteUrls';
import {
  isDuplicatePageSlugInProject,
  isLivePagePublished,
} from '@/lib/builder/projectPageRules';
import ProjectWizard from '@/components/platform/ProjectWizard';
import '@/styles/builder/projects-manager.css';

async function readJsonSafe(response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function buildApiErrorMessage(data, fallback) {
  const base = data?.error || fallback;
  const details = typeof data?.details === 'string' ? data.details.trim() : '';
  return details ? `${base} (${details})` : base;
}

function defaultSlugFromTitle(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validatePageDraft(draft, pagesInProject) {
  const title = String(draft?.title || '').trim();
  const slug = defaultSlugFromTitle(draft?.slug);
  if (!title) return 'Page title is required.';
  if (!slug) return 'Page slug is required (use letters, numbers, and hyphens).';
  if (
    isDuplicatePageSlugInProject(
      (pagesInProject || []).map((p) => ({
        id: p.id,
        project_id: draft.projectId,
        slug: p.slug,
      })),
      draft.projectId,
      slug,
      draft.id
    )
  ) {
    return 'Another page in this project already uses that slug.';
  }
  return '';
}

export default function BuilderProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [openProjectId, setOpenProjectId] = useState(null);
  const [pagesByProject, setPagesByProject] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');

  const [newProject, setNewProject] = useState({
    name: '',
    slug: '',
    type: 'website',
  });
  const [newPageByProject, setNewPageByProject] = useState({});
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creatingPageProjectId, setCreatingPageProjectId] = useState(null);
  const [isUpdatingPage, setIsUpdatingPage] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editPageDraft, setEditPageDraft] = useState(null);
  const [editPageError, setEditPageError] = useState('');
  const [editProjectDraft, setEditProjectDraft] = useState(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const openProject = useMemo(
    () => projects.find((p) => Number(p.id) === Number(openProjectId)) || null,
    [projects, openProjectId]
  );

  const loadProjects = async () => {
    setLoadingProjects(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/projects', { cache: 'no-store' });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(buildApiErrorMessage(data, 'Failed to load projects'));
      }
      const safeProjects = Array.isArray(data.projects) ? data.projects : [];
      setProjects(safeProjects);
      if (data?.warning) {
        setError(String(data.warning));
      }
      setOpenProjectId((current) => {
        if (current && safeProjects.some((p) => Number(p.id) === Number(current))) return current;
        return safeProjects[0]?.id || null;
      });
      if (!safeProjects.length) {
        setNewProjectOpen(true);
      }
    } catch (err) {
      setProjects([]);
      setOpenProjectId(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadPages = async (projectId) => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/pages`, { cache: 'no-store' });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to load pages');
      setPagesByProject((prev) => ({
        ...prev,
        [projectId]: Array.isArray(data.pages) ? data.pages : [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (openProjectId) {
      loadPages(openProjectId);
    }
  }, [openProjectId]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setIsCreatingProject(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(buildApiErrorMessage(data, 'Failed to create project'));
      }
      await loadProjects();
      if (data?.project?.id) {
        setOpenProjectId(data.project.id);
        await loadPages(data.project.id);
      }
      setNewProject({ name: '', slug: '', type: 'website' });
      setSuccessMessage('Project created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCreatePage = async (projectId) => {
    const draft = newPageByProject[projectId];
    if (!draft?.title || !draft?.slug) return;
    setCreatingPageProjectId(projectId);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft.title, slug: draft.slug }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to create page');
      await loadPages(projectId);
      await loadProjects();
      setNewPageByProject((prev) => ({ ...prev, [projectId]: { title: '', slug: '' } }));
      setSuccessMessage('Page created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingPageProjectId(null);
    }
  };

  const handleEditProjectSave = async () => {
    if (!editProjectDraft?.id) return;
    setIsUpdatingProject(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/projects/${editProjectDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProjectDraft.name,
          slug: editProjectDraft.slug,
        }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to update project');
      await loadProjects();
      setOpenProjectId(editProjectDraft.id);
      await loadPages(editProjectDraft.id);
      setEditProjectDraft(null);
      setSuccessMessage('Project updated. URLs now use the new project slug.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const openEditPageModal = (page, project) => {
    if (!page?.id || !project?.id) return;
    setEditPageError('');
    setEditPageDraft({
      id: page.id,
      projectId: project.id,
      projectSlug: project.slug,
      title: page.title,
      slug: page.slug,
      initialSlug: page.slug,
      status: page.status || 'draft',
    });
  };

  const handleEditPageSave = async (event) => {
    event?.preventDefault?.();
    if (!editPageDraft?.id) return;

    const pagesForProject = pagesByProject[editPageDraft.projectId] || [];
    const validationError = validatePageDraft(editPageDraft, pagesForProject);
    if (validationError) {
      setEditPageError(validationError);
      return;
    }

    const title = String(editPageDraft.title).trim();
    const slug = defaultSlugFromTitle(editPageDraft.slug);

    setIsUpdatingPage(true);
    setError('');
    setEditPageError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/pages/${editPageDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(buildApiErrorMessage(data, 'Failed to update page'));

      const projectSlug = data.projectSlug || editPageDraft.projectSlug;
      await loadPages(editPageDraft.projectId);
      await loadProjects();
      setEditPageDraft(null);
      setSuccessMessage(
        `Page saved. Public: /${projectSlug}/${slug} · Builder: ${adminBuilderPagePath(projectSlug, slug)} · Preview: ${previewPagePath(projectSlug, slug)}`
      );
    } catch (err) {
      setEditPageError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUpdatingPage(false);
    }
  };

  const handleDeletePage = async (page) => {
    if (!page?.id) return;
    const confirmed = window.confirm(
      `Delete page "${page.title}"?\n\nThis will remove its draft nodes and versions.`
    );
    if (!confirmed) return;

    setDeletingPageId(page.id);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to delete page');
      await loadPages(page.projectId);
      await loadProjects();
      setSuccessMessage('Page deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDeleteProject = async (project) => {
    if (!project?.id) return;
    const confirmed = window.confirm(
      `Delete project "${project.name}"?\n\nThis deletes ALL pages and builder data in this project.`
    );
    if (!confirmed) return;
    setDeletingProjectId(project.id);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(buildApiErrorMessage(data, 'Failed to delete project'));
      await loadProjects();
      setSuccessMessage('Project deleted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingProjectId(null);
    }
  };

  const pages = openProject ? pagesByProject[openProject.id] || [] : [];
  const canDeleteAnyPage = pages.length > 1;

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        String(p.name || '')
          .toLowerCase()
          .includes(q) ||
        String(p.slug || '')
          .toLowerCase()
          .includes(q)
    );
  }, [projects, projectSearch]);

  const stats = useMemo(() => {
    let totalPages = 0;
    let publishedPages = 0;
    for (const list of Object.values(pagesByProject)) {
      for (const p of list) {
        totalPages += 1;
        if (isLivePagePublished(p)) publishedPages += 1;
      }
    }
    const openPublished = pages.filter((p) => isLivePagePublished(p)).length;
    return {
      projects: projects.length,
      totalPages,
      publishedPages,
      openPublished,
      openDrafts: pages.length - openPublished,
    };
  }, [projects.length, pagesByProject, pages]);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage(`Copied: ${text}`);
      setError('');
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  return (
    <div className="pm-app">
      <header className="pm-topbar">
        <Link href="/" className="pm-brand">
          <span className="pm-brand__mark" aria-hidden="true">
            B
          </span>
          <span className="pm-brand__text">
            <span className="pm-brand__name">Builder Custom</span>
            <span className="pm-brand__sub">Project manager</span>
          </span>
        </Link>
        <nav className="pm-topbar__nav" aria-label="Top">
          <div className="pm-stat-pills" aria-label="Overview">
            <span className="pm-stat-pill">
              <strong>{stats.projects}</strong> projects
            </span>
            <span className="pm-stat-pill">
              <strong>{stats.totalPages}</strong> pages
            </span>
            <span className="pm-stat-pill pm-stat-pill--green">
              <strong>{stats.publishedPages}</strong> live
            </span>
          </div>
          <Link className="pm-topbar__link" href="/admin/publishing">
            Publishing
          </Link>
          <Link className="pm-topbar__link" href="/">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="pm-container">
        {successMessage || error ? (
          <div className="pm-toast-stack">
            {successMessage ? <p className="pm-alert pm-alert--success">{successMessage}</p> : null}
            {error ? <p className="pm-alert pm-alert--error">{error}</p> : null}
          </div>
        ) : null}

        <div className="pm-workspace">
          <div className="pm-col-left">
            <section className={`pm-create pm-create--sidebar ${newProjectOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="pm-create__toggle"
                onClick={() => setNewProjectOpen((v) => !v)}
                aria-expanded={newProjectOpen}
              >
                <span className="pm-create__toggle-icon" aria-hidden="true">
                  {newProjectOpen ? '−' : '+'}
                </span>
                <span className="pm-create__toggle-text">
                  <span className="pm-create__title">New project</span>
                  <span className="pm-create__sub">Includes Home page</span>
                </span>
              </button>
              {newProjectOpen ? (
                <form onSubmit={handleCreateProject} className="pm-create__body pm-create__form">
                  <label className="pm-field">
                    <span className="pm-field__label">Project name</span>
                    <input
                      className="pm-input"
                      placeholder="My website"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject((prev) => ({
                          ...prev,
                          name: e.target.value,
                          slug: prev.slug ? prev.slug : defaultSlugFromTitle(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="pm-field">
                    <span className="pm-field__label">URL slug</span>
                    <input
                      className="pm-input"
                      placeholder="my-website"
                      value={newProject.slug}
                      onChange={(e) =>
                        setNewProject((prev) => ({ ...prev, slug: defaultSlugFromTitle(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="pm-field">
                    <span className="pm-field__label">Type</span>
                    <select
                      className="pm-input"
                      value={newProject.type}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="website">Website</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="admin">Admin</option>
                      <option value="app">App</option>
                    </select>
                  </label>
                  <button className="pm-btn pm-btn--primary pm-btn--block" type="submit" disabled={isCreatingProject}>
                    {isCreatingProject ? 'Creating…' : 'Create project'}
                  </button>
                  <button
                    type="button"
                    className="pm-btn pm-btn--block"
                    style={{ marginTop: 8 }}
                    onClick={() => setWizardOpen(true)}
                  >
                    Website wizard…
                  </button>
                </form>
              ) : null}
            </section>

            <ProjectWizard
              open={wizardOpen}
              onClose={() => setWizardOpen(false)}
              onComplete={async (data) => {
                await loadProjects();
                if (data?.project?.id) {
                  setOpenProjectId(data.project.id);
                  await loadPages(data.project.id);
                }
                setSuccessMessage('Project generated with pages, SEO, and global sections.');
                setWizardOpen(false);
              }}
            />

            <aside className="pm-sidebar">
            <div className="pm-sidebar__head">
              <h2 className="pm-sidebar__title">Projects</h2>
              <span className="pm-sidebar__count">{projects.length}</span>
            </div>
            {projects.length > 4 ? (
              <input
                className="pm-input pm-sidebar__search"
                type="search"
                placeholder="Search…"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                aria-label="Search projects"
              />
            ) : null}
            {loadingProjects ? <p className="pm-loading">Loading…</p> : null}
            {!loadingProjects && !projects.length ? (
              <p className="pm-muted pm-sidebar__empty">No projects yet.</p>
            ) : null}
            {!loadingProjects && projects.length && !filteredProjects.length ? (
              <p className="pm-muted pm-sidebar__empty">No matches.</p>
            ) : null}
            <ul className="pm-project-nav">
              {filteredProjects.map((project) => {
                const isActive = Number(openProjectId) === Number(project.id);
                return (
                  <li
                    key={project.id}
                    className={`pm-project-nav__item ${isActive ? 'is-active' : ''}`}
                  >
                    <button
                      className="pm-project-nav__btn"
                      type="button"
                      onClick={() => setOpenProjectId(project.id)}
                    >
                      <span className="pm-project-nav__name">{project.name}</span>
                      <span className="pm-project-nav__meta">
                        <code>/{project.slug}</code> · {project.pageCount} pg
                      </span>
                    </button>
                    <button
                      className="pm-icon-btn"
                      type="button"
                      onClick={() => handleDeleteProject(project)}
                      disabled={deletingProjectId === project.id}
                      title="Delete project"
                      aria-label={`Delete ${project.name}`}
                    >
                      {deletingProjectId === project.id ? '…' : '×'}
                    </button>
                  </li>
                );
              })}
            </ul>
            </aside>
          </div>

          <main className="pm-main">
            {!openProject ? (
              <div className="pm-empty">
                <p className="pm-empty__title">Select a project</p>
                <p className="pm-muted">Choose a project from the sidebar or create a new one above.</p>
              </div>
            ) : (
              <>
                <header className="pm-main__head">
                  <div className="pm-main__head-main">
                    <h1 className="pm-main__title">{openProject.name}</h1>
                    <p className="pm-main__meta">
                      <span className="pm-badge pm-badge--slug" title="Public URL prefix">
                        <code>/{String(openProject.slug || '').toLowerCase()}</code>
                      </span>
                      <span className="pm-badge pm-badge--type">{openProject.type}</span>
                    </p>
                    <div className="pm-main__counts">
                      <span>
                        <strong>{pages.length}</strong> pages
                      </span>
                      <span className="pm-dot" aria-hidden="true">
                        ·
                      </span>
                      <span className="pm-main__counts--live">
                        <strong>{stats.openPublished}</strong> published
                      </span>
                      <span className="pm-dot" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        <strong>{stats.openDrafts}</strong> draft
                      </span>
                    </div>
                  </div>
                  <div className="pm-main__head-actions">
                    <button
                      className="pm-btn pm-btn--secondary pm-btn--sm"
                      type="button"
                      onClick={() => copyText(`/${openProject.slug}`)}
                      title="Copy project base path"
                    >
                      Copy base URL
                    </button>
                    <button
                      className="pm-btn pm-btn--primary pm-btn--sm"
                      type="button"
                      onClick={() =>
                        setEditProjectDraft({
                          id: openProject.id,
                          name: openProject.name,
                          slug: openProject.slug,
                        })
                      }
                      disabled={isUpdatingProject || isUpdatingPage}
                    >
                      Project settings
                    </button>
                  </div>
                </header>

                <section className="pm-pages" aria-labelledby="pm-pages-heading">
                  <div className="pm-pages__toolbar">
                    <div className="pm-pages__toolbar-head">
                      <h2 id="pm-pages-heading" className="pm-pages__title">
                        Pages
                      </h2>
                      <p className="pm-pages__subtitle">
                        {pages.length
                          ? `${pages.length} in this project`
                          : 'No pages yet — add one to get started'}
                      </p>
                    </div>
                    <form
                      className="pm-add-page-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreatePage(openProject.id);
                      }}
                    >
                      <label className="pm-field pm-field--inline">
                        <span className="pm-field__label">Title</span>
                        <input
                          className="pm-input"
                          placeholder="About us"
                          value={newPageByProject[openProject.id]?.title || ''}
                          onChange={(e) =>
                            setNewPageByProject((prev) => {
                              const nextTitle = e.target.value;
                              const current = prev[openProject.id] || { title: '', slug: '' };
                              return {
                                ...prev,
                                [openProject.id]: {
                                  ...current,
                                  title: nextTitle,
                                  slug: current.slug ? current.slug : defaultSlugFromTitle(nextTitle),
                                },
                              };
                            })
                          }
                        />
                      </label>
                      <label className="pm-field pm-field--inline">
                        <span className="pm-field__label">Slug</span>
                        <input
                          className="pm-input"
                          placeholder="about-us"
                          value={newPageByProject[openProject.id]?.slug || ''}
                          onChange={(e) =>
                            setNewPageByProject((prev) => {
                              const current = prev[openProject.id] || { title: '', slug: '' };
                              return {
                                ...prev,
                                [openProject.id]: {
                                  ...current,
                                  slug: defaultSlugFromTitle(e.target.value),
                                },
                              };
                            })
                          }
                        />
                      </label>
                      <button
                        className="pm-btn pm-btn--primary"
                        type="submit"
                        disabled={creatingPageProjectId === openProject.id}
                      >
                        {creatingPageProjectId === openProject.id ? 'Adding…' : 'Add page'}
                      </button>
                    </form>
                  </div>

                  {!pages.length ? (
                    <div className="pm-empty pm-empty--inset">
                      <p className="pm-empty__title">No pages yet</p>
                      <p className="pm-muted">Use the form above to create your first page.</p>
                    </div>
                  ) : (
                    <div className="pm-table-wrap">
                      <table className="pm-table">
                        <thead>
                          <tr>
                            <th scope="col" className="pm-table__col-page">
                              Page
                            </th>
                            <th scope="col" className="pm-table__col-url">
                              URL
                            </th>
                            <th scope="col" className="pm-table__col-status">
                              Status
                            </th>
                            <th scope="col" className="pm-table__actions-col">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pages.map((page) => {
                            const publicPath = publicPagePath(openProject.slug, page.slug);
                            const published = isLivePagePublished(page);
                            return (
                              <tr key={page.id}>
                                <td className="pm-table__col-page">
                                  <span className="pm-table__page-name">{page.title}</span>
                                </td>
                                <td className="pm-table__col-url">
                                  <div className="pm-url-cell">
                                    <code className="pm-url-code" title={publicPath}>
                                      {publicPath}
                                    </code>
                                    <button
                                      type="button"
                                      className="pm-copy-btn"
                                      onClick={() => copyText(publicPath)}
                                      title="Copy URL path"
                                      aria-label={`Copy ${publicPath}`}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </td>
                                <td className="pm-table__col-status">
                                  <span
                                    className={`pm-status pm-status--${published ? 'published' : 'draft'}`}
                                  >
                                    {published ? 'Published' : 'Draft'}
                                  </span>
                                </td>
                                <td className="pm-table__col-actions">
                                  <div className="pm-action-group" role="group" aria-label={`Actions for ${page.title}`}>
                                    <Link
                                      className="pm-action pm-action--primary"
                                      href={adminBuilderPagePath(openProject.slug, page.slug)}
                                    >
                                      Builder
                                    </Link>
                                    {published ? (
                                      <Link
                                        className="pm-action pm-action--outline"
                                        href={publicPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Live
                                      </Link>
                                    ) : (
                                      <Link
                                        className="pm-action pm-action--outline"
                                        href={previewPagePath(openProject.slug, page.slug)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Preview
                                      </Link>
                                    )}
                                    <button
                                      className="pm-action pm-action--outline"
                                      type="button"
                                      onClick={() => openEditPageModal(page, openProject)}
                                      disabled={isUpdatingPage || deletingPageId === page.id}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="pm-action pm-action--icon"
                                      type="button"
                                      onClick={() =>
                                        handleDeletePage({
                                          id: page.id,
                                          projectId: openProject.id,
                                          title: page.title,
                                        })
                                      }
                                      disabled={
                                        isUpdatingPage ||
                                        deletingPageId === page.id ||
                                        !canDeleteAnyPage
                                      }
                                      title={
                                        canDeleteAnyPage ? 'Delete page' : 'Keep at least one page'
                                      }
                                      aria-label={`Delete ${page.title}`}
                                    >
                                      {deletingPageId === page.id ? '…' : '×'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {editProjectDraft ? (
        <div
          role="dialog"
          aria-modal="true"
          className="pm-modal"
          onClick={() => {
            if (isUpdatingProject) return;
            setEditProjectDraft(null);
          }}
        >
          <div className="pm-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3 className="pm-modal__title">Edit project</h3>
            <p className="pm-muted pm-path-hint">
              All pages live under <code>/{editProjectDraft.slug || 'project-slug'}/…</code>. Changing slug
              updates every page URL (old links stop working until you republish).
            </p>
            <form
              className="pm-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditProjectSave();
              }}
            >
              <label className="pm-field">
                <span className="pm-field__label">Project name</span>
                <input
                  className="pm-input"
                  placeholder="e.g. My Website"
                  value={editProjectDraft.name}
                  onChange={(e) =>
                    setEditProjectDraft((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug ? prev.slug : defaultSlugFromTitle(e.target.value),
                    }))
                  }
                  disabled={isUpdatingProject}
                />
              </label>
              <label className="pm-field">
                <span className="pm-field__label">Project slug (URL prefix)</span>
                <input
                  className="pm-input"
                  placeholder="e.g. my-website"
                  value={editProjectDraft.slug}
                  onChange={(e) =>
                    setEditProjectDraft((prev) => ({
                      ...prev,
                      slug: defaultSlugFromTitle(e.target.value),
                    }))
                  }
                  disabled={isUpdatingProject}
                />
              </label>
            <div className="pm-actions">
              <button
                className="pm-btn"
                type="button"
                onClick={() => setEditProjectDraft(null)}
                disabled={isUpdatingProject}
              >
                Cancel
              </button>
              <button className="pm-btn pm-btn--primary" type="submit" disabled={isUpdatingProject}>
                {isUpdatingProject ? 'Saving…' : 'Save project'}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}

      {editPageDraft ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-edit-page-title"
          className="pm-modal"
          onClick={() => {
            if (isUpdatingPage) return;
            setEditPageDraft(null);
            setEditPageError('');
          }}
        >
          <div className="pm-modal__card pm-modal__card--lg" onClick={(e) => e.stopPropagation()}>
            <h3 id="pm-edit-page-title" className="pm-modal__title">
              Edit page
            </h3>
            <p className="pm-muted pm-path-hint">
              Status: <strong>{editPageDraft.status}</strong>
              {editPageDraft.initialSlug &&
              defaultSlugFromTitle(editPageDraft.slug) !== editPageDraft.initialSlug ? (
                <>
                  {' '}
                  · URL will change from <code>/{editPageDraft.projectSlug}/{editPageDraft.initialSlug}</code>
                </>
              ) : null}
            </p>
            <dl className="pm-url-preview">
              <div>
                <dt>Public URL</dt>
                <dd>
                  <code>
                    /{editPageDraft.projectSlug}/{defaultSlugFromTitle(editPageDraft.slug) || 'page-slug'}
                  </code>
                </dd>
              </div>
              <div>
                <dt>Builder URL</dt>
                <dd>
                  <code>
                    {adminBuilderPagePath(
                      editPageDraft.projectSlug,
                      defaultSlugFromTitle(editPageDraft.slug) || 'page-slug'
                    )}
                  </code>
                </dd>
              </div>
              <div>
                <dt>Draft preview</dt>
                <dd>
                  <code>
                    {previewPagePath(
                      editPageDraft.projectSlug,
                      defaultSlugFromTitle(editPageDraft.slug) || 'page-slug'
                    )}
                  </code>
                </dd>
              </div>
            </dl>
            {editPageError ? <p className="pm-alert pm-alert--error pm-alert--compact">{editPageError}</p> : null}
            <form className="pm-form" onSubmit={handleEditPageSave}>
              <label className="pm-field">
                <span className="pm-field__label">Page title</span>
                <input
                  className="pm-input"
                  placeholder="e.g. About us"
                  value={editPageDraft.title}
                  onChange={(e) => {
                    setEditPageError('');
                    setEditPageDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }));
                  }}
                  disabled={isUpdatingPage}
                  autoFocus
                />
              </label>
              <label className="pm-field">
                <span className="pm-field__label">Page slug (URL segment)</span>
                <input
                  className="pm-input"
                  placeholder="e.g. about-us"
                  value={editPageDraft.slug}
                  onChange={(e) => {
                    setEditPageError('');
                    setEditPageDraft((prev) => ({
                      ...prev,
                      slug: defaultSlugFromTitle(e.target.value),
                    }));
                  }}
                  disabled={isUpdatingPage}
                />
              </label>
              <button
                className="pm-btn pm-btn--ghost"
                type="button"
                disabled={isUpdatingPage}
                onClick={() => {
                  setEditPageError('');
                  setEditPageDraft((prev) => ({
                    ...prev,
                    slug: defaultSlugFromTitle(prev.title),
                  }));
                }}
              >
                Generate slug from title
              </button>
              <div className="pm-actions">
                <button
                  className="pm-btn"
                  type="button"
                  onClick={() => {
                    setEditPageDraft(null);
                    setEditPageError('');
                  }}
                  disabled={isUpdatingPage}
                >
                  Cancel
                </button>
                <button className="pm-btn pm-btn--primary" type="submit" disabled={isUpdatingPage}>
                  {isUpdatingPage ? 'Saving…' : 'Save page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

