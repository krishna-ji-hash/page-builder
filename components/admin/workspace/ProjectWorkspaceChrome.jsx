'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ADMIN_PROJECTS_PATH,
  PROJECT_SECTIONS,
  adminActivePathOpts,
  adminProjectPagesAddPath,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import {
  formatProjectWorkspaceMeta,
  projectWorkspaceInitial,
} from '@/lib/admin/projectWorkspaceMeta';
import '@/styles/admin/project-workspace.css';

export default function ProjectWorkspaceChrome({
  project,
  activeProjectId = null,
  activeProjectSlug = null,
  primaryDomain = null,
  section = 'overview',
  loading = false,
  error = '',
  stats = null,
  actions = null,
  children,
}) {
  const pathOpts = useMemo(
    () =>
      adminActivePathOpts({
        id: activeProjectId,
        slug: activeProjectSlug,
      }),
    [activeProjectId, activeProjectSlug]
  );

  const metaChips = useMemo(
    () => (project ? formatProjectWorkspaceMeta(project, { activeProjectId, primaryDomain }) : []),
    [project, activeProjectId, primaryDomain]
  );

  const sectionLabel = PROJECT_SECTIONS.find((s) => s.id === section)?.label || 'Workspace';

  const defaultActions = project ? (
    <>
      <Link className="proj-workspace__btn proj-workspace__btn--primary" href={adminProjectPagesAddPath(project, pathOpts)}>
        Add page
      </Link>
      <Link className="proj-workspace__btn" href={adminProjectSectionPath(project, 'pages', pathOpts)}>
        All pages
      </Link>
      <Link className="proj-workspace__btn" href={adminBuilderPagePath(project, 'home', pathOpts)}>
        Open builder
      </Link>
      <Link className="proj-workspace__btn" href={adminProjectSectionPath(project, 'domains', pathOpts)}>
        Domains
      </Link>
    </>
  ) : null;

  return (
    <div className="proj-workspace">
      <div className="proj-workspace__toolbar">
        <Link className="proj-workspace__back" href={ADMIN_PROJECTS_PATH}>
          ← All projects
        </Link>
      </div>

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !project ? (
        <div className="proj-workspace__skeleton" aria-hidden="true" />
      ) : null}

      {project ? (
        <header className="proj-workspace__hero">
          <div className="proj-workspace__hero-main">
            <span className="proj-workspace__avatar" aria-hidden="true">
              {projectWorkspaceInitial(project.name)}
            </span>
            <div className="proj-workspace__hero-text">
              <p className="proj-workspace__badge">Workspace · {sectionLabel}</p>
              <h1 className="proj-workspace__title">{project.name}</h1>
              {metaChips.length ? (
                <p className="proj-workspace__meta">
                  {metaChips.map((chip, index) => (
                    <span key={chip.key}>
                      {index > 0 ? <span className="proj-workspace__meta-sep">·</span> : null}
                      <span
                        className={`proj-workspace__meta-chip proj-workspace__meta-chip--${chip.key}`}
                      >
                        {chip.label}
                      </span>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
          <div className="proj-workspace__hero-side">
            {stats ? <div className="proj-workspace__stats">{stats}</div> : null}
            <div className="proj-workspace__actions">{actions ?? defaultActions}</div>
          </div>
        </header>
      ) : null}

      {!loading && !project && !error ? (
        <div className="proj-workspace__empty">
          <p className="proj-workspace__empty-title">Project not found</p>
          <p className="proj-workspace__empty-text">Choose a project from the list or set a localhost default.</p>
          <Link className="proj-workspace__btn proj-workspace__btn--primary" href={ADMIN_PROJECTS_PATH}>
            Go to projects
          </Link>
        </div>
      ) : null}

      {project ? <div className="proj-workspace__body">{children}</div> : null}
    </div>
  );
}
