'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashBarChart from '@/components/admin/dashboard/DashBarChart';
import DashDonutChart from '@/components/admin/dashboard/DashDonutChart';
import DashGauge from '@/components/admin/dashboard/DashGauge';
import DashWorkflow from '@/components/admin/dashboard/DashWorkflow';
import {
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
} from '@/lib/admin/adminRoutes';
import '@/styles/admin/platform.css';
import '@/styles/admin/dashboard.css';

const STAT_CARDS = [
  {
    key: 'projects',
    label: 'Projects',
    tone: 'projects',
    hint: 'Active workspaces',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: 'pages',
    label: 'Pages',
    tone: 'pages',
    hint: 'Total pages',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5.5 3.5h6l3 3v10a1 1 0 01-1 1h-8a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11.5 3.5V7h3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: 'published',
    label: 'Published',
    tone: 'published',
    hint: 'Live on the web',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'drafts',
    label: 'Drafts',
    tone: 'drafts',
    hint: 'Not yet published',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 4.5h10v11H5v-11z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function healthTone(score) {
  if (score == null) return 'muted';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'bad';
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch('/api/platform/publishing', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/platform/health', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([projectsData, publishingData, healthData]) => {
        const projects = Array.isArray(projectsData?.projects) ? projectsData.projects : [];
        const pubSummary = publishingData?.summary || {};
        setSummary({
          projects: projects.length,
          pages: pubSummary.pages ?? 0,
          published: pubSummary.published ?? 0,
          drafts: pubSummary.drafts ?? 0,
        });
        setHealth(healthData);
      })
      .finally(() => setLoading(false));
  }, []);

  const healthScore = health?.overall;
  const healthPanels = health?.panels || [];
  const publishRate =
    summary && summary.pages > 0 ? Math.round((summary.published / summary.pages) * 100) : 0;

  return (
    <div className="platform-shell dash">
      <header className="dash-hero">
        <div className="dash-hero__main">
          <p className="dash-hero__badge">Platform dashboard</p>
          <h1 className="dash-hero__title">Welcome back</h1>
          <p className="dash-hero__sub">
            Overview of your projects, publishing status, and platform health — everything in one place.
          </p>
        </div>
        <div className="dash-hero__actions">
          <Link className="platform-btn" href={ADMIN_PROJECT_NEW_PATH}>
            + New project
          </Link>
          <Link className="platform-btn platform-btn--primary" href={ADMIN_PROJECTS_PATH}>
            Open sites
          </Link>
        </div>
      </header>

      <section className="dash-section" aria-labelledby="dash-stats-title">
        <div className="dash-section__head">
          <h2 id="dash-stats-title" className="dash-section__title">
            Stats
          </h2>
        </div>

        {loading ? (
          <div className="dash-skeleton-stats" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="dash-skeleton-block" />
            ))}
          </div>
        ) : summary ? (
          <div className="dash-stats">
            {STAT_CARDS.map((card) => (
              <article key={card.key} className={`dash-stat dash-stat--${card.tone}`}>
                <div className="dash-stat__top">
                  <span className="dash-stat__label">{card.label}</span>
                  <span className="dash-stat__icon">{card.icon}</span>
                </div>
                <div className="dash-stat__value">{summary[card.key] ?? 0}</div>
                <p className="dash-stat__hint">{card.hint}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="dash-charts">
        <section className="dash-card" aria-labelledby="dash-publish-title">
          <div className="dash-card__head">
            <div>
              <p className="dash-card__eyebrow">Publishing</p>
              <h2 id="dash-publish-title" className="dash-card__title">
                Page status mix
              </h2>
            </div>
            {!loading && summary ? (
              <span className="dash-card__badge dash-card__badge--blue">{publishRate}% live</span>
            ) : null}
          </div>
          {loading ? (
            <div className="dash-skeleton-block dash-skeleton-block--chart" aria-hidden="true" />
          ) : summary ? (
            <DashDonutChart published={summary.published} drafts={summary.drafts} />
          ) : null}
        </section>

        <section className="dash-card" aria-labelledby="dash-health-title">
          <div className="dash-card__head">
            <div>
              <p className="dash-card__eyebrow">Health</p>
              <h2 id="dash-health-title" className="dash-card__title">
                Platform health
              </h2>
            </div>
            <Link className="dash-card__link" href={ADMIN_PLATFORM_HEALTH_PATH}>
              Full report →
            </Link>
          </div>

          {loading ? (
            <div className="dash-skeleton-block dash-skeleton-block--chart" aria-hidden="true" />
          ) : (
            <div className="dash-health-grid">
              <DashGauge value={healthScore} tone={healthTone(healthScore)} />
              <DashBarChart items={healthPanels} />
            </div>
          )}
        </section>
      </div>

      <DashWorkflow />
    </div>
  );
}
