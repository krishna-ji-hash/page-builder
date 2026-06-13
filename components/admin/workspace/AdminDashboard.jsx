'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminSitesHub from '@/components/admin/AdminSitesHub';
import {
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECTS_PATH,
  ADMIN_PUBLISHING_PATH,
} from '@/lib/admin/adminRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/sites-hub.css';

const QUICK_LINKS = [
  { href: ADMIN_PROJECTS_PATH, label: 'Your sites', desc: 'Manage projects & pages' },
  { href: ADMIN_PUBLISHING_PATH, label: 'Publishing', desc: 'Publish & unpublish' },
  { href: ADMIN_PLATFORM_HEALTH_PATH, label: 'Health', desc: 'Platform audits' },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch('/api/platform/publishing', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([projectsData, publishingData]) => {
        const projects = Array.isArray(projectsData?.projects) ? projectsData.projects : [];
        const pubSummary = publishingData?.summary || {};
        setSummary({
          projects: projects.length,
          pages: pubSummary.pages ?? 0,
          published: pubSummary.published ?? 0,
          drafts: pubSummary.drafts ?? 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="platform-shell">
      <header className="admin-page__header">
        <div className="admin-page__header-main">
          <h1>Welcome back</h1>
          <p>Platform overview — projects, pages, and publishing at a glance.</p>
        </div>
        <div className="admin-page__header-actions">
          <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECTS_PATH}>
            Open sites
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="platform-skeleton-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="platform-skeleton platform-skeleton--card" />
          ))}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="platform-grid">
            <div className="platform-card platform-card--projects">
              <div className="platform-card__label">Projects</div>
              <div className="platform-card__score">{summary.projects}</div>
            </div>
            <div className="platform-card platform-card--pages">
              <div className="platform-card__label">Pages</div>
              <div className="platform-card__score">{summary.pages}</div>
            </div>
            <div className="platform-card platform-card--published">
              <div className="platform-card__label">Published</div>
              <div className="platform-card__score">{summary.published}</div>
            </div>
            <div className="platform-card platform-card--drafts">
              <div className="platform-card__label">Drafts</div>
              <div className="platform-card__score">{summary.drafts}</div>
            </div>
          </div>

          <div className="dash-quick">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} className="dash-quick__item" href={link.href}>
                <span className="dash-quick__label">{link.label}</span>
                <span className="dash-quick__desc">{link.desc}</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <AdminSitesHub limit={3} />
    </div>
  );
}
