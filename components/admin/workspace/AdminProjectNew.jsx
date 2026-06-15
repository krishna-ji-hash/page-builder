'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import { normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import '@/styles/admin/platform.css';
import '@/styles/admin/project-new.css';

function slugFromTitle(title) {
  return normalizeBuilderSlug(String(title || ''));
}

const PROJECT_TYPES = [
  {
    value: 'website',
    label: 'Website',
    hint: 'Marketing pages & landing sites',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'dashboard',
    label: 'Dashboard',
    hint: 'Data views & admin panels',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="9" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'admin',
    label: 'Admin',
    hint: 'Internal tools & ops UI',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.5l5 2v4.5c0 2.8-2.1 4.4-5 5-2.9-.6-5-2.2-5-5V4.5l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'app',
    label: 'App',
    hint: 'Product-style multi-page app',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="4" y="1.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="12.5" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
];

const STEPS = [
  { tone: '', title: 'Create project', text: 'Name your site and pick a URL slug.' },
  { tone: 'mint', title: 'Open builder', text: 'Home page is created automatically.' },
  { tone: 'peach', title: 'Add templates', text: 'Drag sections from the Templates panel.' },
  { tone: 'rose', title: 'Publish', text: 'Preview the draft, then go live when ready.' },
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
    <div className="project-new">
      <div className="project-new__top">
        <Link className="project-new__back" href={ADMIN_PROJECTS_PATH}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3.5L5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All projects
        </Link>
      </div>

      <header className="project-new__hero">
        <div className="project-new__hero-glow" aria-hidden="true" />
        <p className="project-new__badge">Projects · New</p>
        <h1 className="project-new__title">Create a project</h1>
        <p className="project-new__sub">
          Start with an empty Home page, then design using Templates and Elements in the builder.
        </p>
      </header>

      <div className="project-new__layout">
        <form className="project-new__form" onSubmit={handleSubmit}>
          <div className="project-new__preview" aria-live="polite">
            <span className="project-new__preview-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3 3 7-7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="project-new__preview-body">
              <span className="project-new__preview-label">Live path preview</span>
              <span className="project-new__preview-url">
                /<em>{previewSlug}</em>/home
              </span>
            </span>
          </div>

          <div className="project-new__form-body">
            <h2 className="project-new__form-title">Project details</h2>
            <p className="project-new__form-sub">Required fields — slug becomes part of your public URLs.</p>

            <div className="project-new__field">
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

            <div className="project-new__field">
              <label htmlFor="new-project-slug">URL slug</label>
              <div className="project-new__slug">
                <span className="project-new__slug-prefix">/</span>
                <input
                  id="new-project-slug"
                  value={slug}
                  onChange={(e) => setSlug(normalizeBuilderSlug(e.target.value))}
                  placeholder="my-website"
                  required
                />
              </div>
            </div>

            <div className="project-new__field">
              <span className="project-new__field-label" id="new-project-type-label">
                Project type
              </span>
              <div className="project-new__types" role="radiogroup" aria-labelledby="new-project-type-label">
                {PROJECT_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={type === option.value}
                    className={`project-new__type${type === option.value ? ' is-selected' : ''}`}
                    onClick={() => setType(option.value)}
                  >
                    <span className="project-new__type-icon">{option.icon}</span>
                    <span className="project-new__type-text">
                      <strong>{option.label}</strong>
                      <span>{option.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="platform-alert platform-alert--error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="project-new__actions">
              <button type="submit" className="project-new__submit" disabled={loading}>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 12.5l8.5-8.5 2 2L5 14.5H3v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                {loading ? 'Creating…' : 'Create & open builder'}
              </button>
              <Link className="project-new__cancel" href={ADMIN_PROJECTS_PATH}>
                Cancel
              </Link>
            </div>
          </div>
        </form>

        <aside className="project-new__guide">
          <h2 className="project-new__guide-title">What happens next</h2>
          <ol className="project-new__timeline">
            {STEPS.map((step, index) => (
              <li key={step.title} className={`project-new__step${step.tone ? ` project-new__step--${step.tone}` : ''}`}>
                <span className="project-new__step-marker" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="project-new__step-body">
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="project-new__tip">
            <strong>Tip</strong>
            <p>You can rename pages and add more routes anytime from the project workspace.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
