'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  const [deletingPageId, setDeletingPageId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editPageDraft, setEditPageDraft] = useState(null);

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

  const handleEditPageSave = async () => {
    if (!editPageDraft?.id) return;
    setIsUpdatingPage(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/pages/${editPageDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPageDraft.title,
          slug: editPageDraft.slug,
        }),
      });
      const data = await readJsonSafe(response);
      if (!response.ok) throw new Error(data.error || 'Failed to update page');
      await loadPages(editPageDraft.projectId);
      await loadProjects();
      setEditPageDraft(null);
      setSuccessMessage('Page updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

  const pages = openProject ? pagesByProject[openProject.id] || [] : [];

  return (
    <main className="pm-shell">
      <h1 className="pm-title">Builder Projects</h1>
      {successMessage ? (
        <p className="pm-alert pm-alert--success">{successMessage}</p>
      ) : null}
      {error ? (
        <p className="pm-alert pm-alert--error">{error}</p>
      ) : null}

      <section className="pm-card">
        <h2 className="pm-card__title">Create project</h2>
        <form onSubmit={handleCreateProject} className="pm-grid pm-grid--project-form">
          <input
            className="pm-input"
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                name: e.target.value,
                slug: prev.slug ? prev.slug : defaultSlugFromTitle(e.target.value),
              }))
            }
          />
          <input
            className="pm-input"
            placeholder="project-slug"
            value={newProject.slug}
            onChange={(e) => setNewProject((prev) => ({ ...prev, slug: defaultSlugFromTitle(e.target.value) }))}
          />
          <select
            className="pm-input"
            value={newProject.type}
            onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="website">website</option>
            <option value="dashboard">dashboard</option>
            <option value="admin">admin</option>
            <option value="app">app</option>
          </select>
          <button className="pm-btn pm-btn--primary" type="submit" disabled={isCreatingProject}>
            {isCreatingProject ? 'Creating…' : 'Create'}
          </button>
        </form>
      </section>

      <section className="pm-layout">
        <aside className="pm-card">
          <h2 className="pm-card__title">Projects</h2>
          {loadingProjects ? <p className="pm-muted">Loading…</p> : null}
          {!loadingProjects && !projects.length ? <p className="pm-muted">No projects yet.</p> : null}
          <ul className="pm-list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  className={`pm-project-item ${Number(openProjectId) === Number(project.id) ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setOpenProjectId(project.id)}
                >
                  <div className="pm-project-item__name">{project.name}</div>
                  <div className="pm-project-item__meta">
                    /{project.slug} · {project.type} · {project.pageCount} pages
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="pm-card">
          <h2 className="pm-card__title">
            {openProject ? `Pages — ${openProject.name}` : 'Pages'}
          </h2>
          {!openProject ? <p className="pm-muted">Select a project.</p> : null}

          {openProject ? (
            <>
              <div className="pm-pages">
                {pages.map((page) => (
                  <div key={page.id} className="pm-page-row">
                    <div>
                      <div className="pm-page-row__title">{page.title}</div>
                      <div className="pm-page-row__meta">
                        /{openProject.slug}/{page.slug} · {page.status || 'draft'}
                      </div>
                    </div>
                    <Link className="pm-link-btn" href={`/admin/builder/${page.id}`}>
                      Edit Builder
                    </Link>
                    <Link className="pm-link-btn" href={`/${openProject.slug}/${page.slug}`} target="_blank">
                      Preview
                    </Link>
                    <button
                      className="pm-btn"
                      type="button"
                      onClick={() =>
                        setEditPageDraft({
                          id: page.id,
                          projectId: openProject.id,
                          title: page.title,
                          slug: page.slug,
                        })
                      }
                      disabled={isUpdatingPage || deletingPageId === page.id}
                    >
                      Edit Page
                    </button>
                    <button
                      className="pm-btn pm-btn--danger"
                      type="button"
                      onClick={() =>
                        handleDeletePage({
                          id: page.id,
                          projectId: openProject.id,
                          title: page.title,
                        })
                      }
                      disabled={isUpdatingPage || deletingPageId === page.id}
                    >
                      {deletingPageId === page.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pm-divider">
                <h3 className="pm-subtitle">Add Page</h3>
                <div className="pm-grid pm-grid--page-form">
                  <input
                    className="pm-input"
                    placeholder="Page title"
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
                  <input
                    className="pm-input"
                    placeholder="page-slug"
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
                  <button
                    className="pm-btn pm-btn--primary"
                    type="button"
                    onClick={() => handleCreatePage(openProject.id)}
                    disabled={creatingPageProjectId === openProject.id}
                  >
                    {creatingPageProjectId === openProject.id ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </section>

      {editPageDraft ? (
        <div
          role="dialog"
          aria-modal="true"
          className="pm-modal"
          onClick={() => {
            if (isUpdatingPage) return;
            setEditPageDraft(null);
          }}
        >
          <div className="pm-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3 className="pm-card__title">Edit Page</h3>
            <div className="pm-grid">
              <input
                className="pm-input"
                placeholder="Page title"
                value={editPageDraft.title}
                onChange={(e) =>
                  setEditPageDraft((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: prev.slug ? prev.slug : defaultSlugFromTitle(e.target.value),
                  }))
                }
                disabled={isUpdatingPage}
              />
              <input
                className="pm-input"
                placeholder="page-slug"
                value={editPageDraft.slug}
                onChange={(e) =>
                  setEditPageDraft((prev) => ({
                    ...prev,
                    slug: defaultSlugFromTitle(e.target.value),
                  }))
                }
                disabled={isUpdatingPage}
              />
            </div>
            <div className="pm-actions">
              <button className="pm-btn" type="button" onClick={() => setEditPageDraft(null)} disabled={isUpdatingPage}>
                Cancel
              </button>
              <button className="pm-btn pm-btn--primary" type="button" onClick={handleEditPageSave} disabled={isUpdatingPage}>
                {isUpdatingPage ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

