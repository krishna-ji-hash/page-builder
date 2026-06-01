'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import '@/styles/admin/platform.css';

export default function PlatformHealthPanel() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/platform/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="platform-shell">
      <h1>Platform health</h1>
      <p className="platform-shell__sub">
        Builder, SEO, CMS, performance, and section contrast audits.
      </p>

      {loading && <p>Loading…</p>}

      {health && (
        <>
          <div className="platform-card" style={{ marginBottom: 24 }}>
            <div className="platform-card__score">{health.overall}</div>
            <div>Overall health score</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Generated {new Date(health.generatedAt).toLocaleString()}
            </div>
          </div>

          <div className="platform-grid">
            {(health.panels || []).map((panel) => (
              <div key={panel.id} className="platform-card">
                <div className="platform-card__score">{panel.score}</div>
                <div>{panel.label}</div>
                {panel.findings != null && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                    {panel.findings} findings
                  </div>
                )}
                {panel.note && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{panel.note}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/admin/publishing">← Publishing manager</Link>
      </p>
    </div>
  );
}
