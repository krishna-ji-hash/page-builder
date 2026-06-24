'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DomainStatusBadge from '@/components/admin/d/DomainStatusBadge';
import { D_PROJECTS_PATH, dProjectPagesPath } from '@/lib/admin/dProjectRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-new.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

export default function DProjectNew() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewSlug = normalizeBuilderSlug(slug) || slugFromTitle(name) || 'my-site';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const normalizedSlug = normalizeBuilderSlug(slug) || slugFromTitle(trimmedName);
    if (!trimmedName || !normalizedSlug) {
      setError('Project name and slug are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          slug: normalizedSlug,
          domain: domain.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create project');

      const projectId = data?.project?.id;
      if (!projectId) throw new Error('Project created but id missing in response');
      router.push(dProjectPagesPath(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-new">
      <div className="project-new__top">
        <Link className="project-new__back" href={D_PROJECTS_PATH}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3.5L5.5 8 10 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All projects
        </Link>
      </div>

      <header className="project-new__hero">
        <p className="project-new__badge">Projects · New</p>
        <h1 className="project-new__title">Create a project</h1>
        <p className="project-new__sub">
          A published Home page is created automatically with starter content.
        </p>
      </header>

      <form className="project-new__form project-new__layout" onSubmit={handleSubmit}>
        <div className="project-new__form-body">
          <h2 className="project-new__form-title">Project details</h2>

          <div className="project-new__field">
            <label htmlFor="d-new-name">Project name</label>
            <input
              id="d-new-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === slugFromTitle(name)) {
                  setSlug(slugFromTitle(e.target.value));
                }
              }}
              placeholder="Dispatch"
              required
              autoFocus
            />
          </div>

          <div className="project-new__field">
            <label htmlFor="d-new-slug">Slug</label>
            <div className="project-new__slug">
              <span className="project-new__slug-prefix">/</span>
              <input
                id="d-new-slug"
                value={slug}
                onChange={(e) => setSlug(normalizeBuilderSlug(e.target.value))}
                placeholder="dispatch"
                required
              />
            </div>
          </div>

          <div className="project-new__field">
            <label htmlFor="d-new-domain">Custom domain (optional)</label>
            <input
              id="d-new-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="dispatch.co.in"
            />
            {domain.trim() ? (
              <div className="d-projects__domain-meta">
                <DomainStatusBadge status="PENDING" title="New domains start as pending until verified" />
                <span className="d-projects__verified-at">Verify after the project is created</span>
              </div>
            ) : null}
          </div>

          <p className="project-new__preview-url" style={{ marginTop: 8 }}>
            Preview path: <code>/{previewSlug}/home</code>
          </p>

          {error ? (
            <p className="platform-alert platform-alert--error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="project-new__actions">
            <button type="submit" className="project-new__submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
            <Link className="project-new__cancel" href={D_PROJECTS_PATH}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
