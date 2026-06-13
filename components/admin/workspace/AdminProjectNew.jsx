'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';
import '@/styles/admin/forms.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

const STEPS = [
  { title: 'Create project', text: 'Name your site and pick a URL slug.' },
  { title: 'Open builder', text: 'Home page is created automatically.' },
  { title: 'Add Templates', text: 'Drag sections from Templates panel.' },
  { title: 'Publish', text: 'Preview draft, then publish when ready.' },
];

export default function AdminProjectNew() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('website');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewSlug = normalizeBuilderSlug(slug) || slugFromTitle(name) || 'my-website';

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
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, slug: normalizedSlug, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create project');

      const projectSlug = data?.project?.slug || normalizedSlug;
      router.push(adminBuilderPagePath(projectSlug, 'home'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Projects · New"
        title="Create a project"
        description="Start with an empty Home page, then design using Templates and Elements in the builder."
      />

      <div className="admin-form-layout">
        <form className="admin-form-card" onSubmit={handleSubmit}>
          <h2 className="admin-form-card__title">Project details</h2>
          <p className="admin-form-card__sub">Required fields — slug becomes part of your public URLs.</p>

          <div className="admin-form-field">
            <label htmlFor="new-project-name">Project name</label>
            <input
              id="new-project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === slugFromTitle(name)) {
                  setSlug(slugFromTitle(e.target.value));
                }
              }}
              placeholder="My website"
              required
              autoFocus
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="new-project-slug">URL slug</label>
            <div className="admin-form-field__prefix">
              <span>/</span>
              <input
                id="new-project-slug"
                value={slug}
                onChange={(e) => setSlug(normalizeBuilderSlug(e.target.value))}
                placeholder="my-website"
                required
              />
            </div>
            <p className="admin-form-field__hint">
              Live path preview: <code>/{previewSlug}/home</code>
            </p>
          </div>

          <div className="admin-form-field">
            <label htmlFor="new-project-type">Project type</label>
            <select id="new-project-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="website">Website</option>
              <option value="dashboard">Dashboard</option>
              <option value="admin">Admin</option>
              <option value="app">App</option>
            </select>
          </div>

          {error ? (
            <p className="platform-alert platform-alert--error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="platform-actions" style={{ marginTop: 8 }}>
            <button type="submit" className="platform-btn platform-btn--primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create & open builder'}
            </button>
            <Link className="platform-btn" href={ADMIN_PROJECTS_PATH}>
              Cancel
            </Link>
          </div>
        </form>

        <aside className="admin-form-aside">
          <h3 className="admin-form-aside__title">What happens next</h3>
          <ol className="admin-form-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="admin-form-steps__num">{index + 1}</span>
                <span className="admin-form-steps__text">
                  <strong>{step.title}</strong>
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
