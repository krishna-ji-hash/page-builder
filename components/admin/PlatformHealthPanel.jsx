'use client';

import { useEffect, useState } from 'react';
import '@/styles/admin/platform.css';

function scoreTone(score) {
  if (score == null) return 'muted';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'bad';
}

export default function PlatformHealthPanel() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/platform/health', { cache: 'no-store' })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load health data');
        setHealth(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="platform-shell">
      <header className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Platform · Monitoring</p>
          <h1>Platform health</h1>
          <p>Builder, SEO, CMS, performance, and section contrast audits.</p>
        </div>
      </header>

      {loading ? (
        <div className="platform-skeleton-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="platform-skeleton platform-skeleton--card" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {health ? (
        <>
          <div className="platform-panel" style={{ marginBottom: 24 }}>
            <div className="platform-panel__body platform-panel__body--padded">
              <div className="platform-health-hero">
                <div>
                  <p className="platform-health-hero__label">Overall health score</p>
                  <p className={`platform-health-hero__score platform-health-hero__score--${scoreTone(health.overall)}`}>
                    {health.overall}
                  </p>
                </div>
                <p className="platform-health-hero__meta">
                  Generated {new Date(health.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="platform-grid">
            {(health.panels || []).map((panel) => (
              <div key={panel.id} className={`platform-card platform-card--health platform-card--health-${scoreTone(panel.score)}`}>
                <div className="platform-card__label">{panel.label}</div>
                <div className="platform-card__score">{panel.score}</div>
                {panel.findings != null ? (
                  <div className="platform-card__hint">{panel.findings} findings</div>
                ) : null}
                {panel.note ? <div className="platform-card__hint">{panel.note}</div> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
