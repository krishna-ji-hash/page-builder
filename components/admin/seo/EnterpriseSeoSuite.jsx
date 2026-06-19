'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJson, ScoreRing, IssueList } from '@/components/admin/seo/seoShared';

const SUITE_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'content', label: 'Content' },
  { id: 'images', label: 'Images' },
  { id: 'links', label: 'Internal Links' },
  { id: 'reports', label: 'Reports' },
];

function Widget({ label, value, tone }) {
  return (
    <div className={`seo-hub__widget${tone ? ` seo-enterprise__widget--${tone}` : ''}`}>
      <h3>{label}</h3>
      <p className="seo-hub__stat">{value}</p>
    </div>
  );
}

export default function EnterpriseSeoSuite({ projectId }) {
  const [section, setSection] = useState('dashboard');
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPageId, setSelectedPageId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/enterprise`, { cache: 'no-store' });
      setSuite(data.suite || null);
      setSelectedPageId((prev) => prev || data.suite?.pages?.[0]?.pageId || null);
    } catch (e) {
      setError(e?.message || 'Failed to load enterprise SEO suite');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPage = useMemo(
    () => (suite?.pages || []).find((p) => p.pageId === selectedPageId) || suite?.pages?.[0] || null,
    [suite, selectedPageId]
  );

  const exportUrl = (format) => `/api/projects/${projectId}/seo/reports/export?format=${format}`;

  const openPdfReport = () => {
    window.open(exportUrl('pdf'), '_blank', 'noopener,noreferrer');
  };

  if (loading && !suite) {
    return <div className="proj-seo__skeleton" aria-hidden="true" />;
  }

  if (error) {
    return (
      <p className="platform-alert platform-alert--error" role="alert">
        {error}
      </p>
    );
  }

  if (!suite) return <p className="seo-hub__empty">No enterprise SEO data.</p>;

  const w = suite.widgets || {};

  return (
    <section className="seo-cc__panel seo-enterprise">
      <header className="seo-enterprise__head">
        <div>
          <h2 className="seo-enterprise__title">Enterprise SEO Suite</h2>
          <p className="proj-seo__hint">Keyword intelligence, content audit, image SEO, internal linking, and exportable reports.</p>
        </div>
        <div className="seo-cc__actions">
          <button type="button" className="proj-seo__save" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      <nav className="seo-enterprise__nav" aria-label="Enterprise SEO modules">
        {SUITE_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`seo-enterprise__nav-btn${section === s.id ? ' seo-enterprise__nav-btn--active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {section === 'dashboard' ? (
        <div className="seo-enterprise__dashboard">
          <div className="seo-hub__scores">
            <ScoreRing score={suite.projectScore} label="Project score" />
            <ScoreRing score={w.indexedPages && w.totalPages ? Math.round((w.indexedPages / w.totalPages) * 100) : 0} label="Indexable %" />
          </div>
          <div className="seo-cc__stat-grid">
            <Widget label="Indexed pages" value={`${w.indexedPages ?? 0} / ${w.totalPages ?? 0}`} />
            <Widget label="Missing metadata" value={w.missingMetadata ?? 0} tone={w.missingMetadata ? 'warn' : ''} />
            <Widget label="Missing schema" value={w.missingSchema ?? 0} tone={w.missingSchema ? 'warn' : ''} />
            <Widget label="Missing alt text" value={w.missingAlt ?? 0} tone={w.missingAlt ? 'warn' : ''} />
            <Widget label="Orphan pages" value={w.orphanPages ?? 0} tone={w.orphanPages ? 'warn' : ''} />
            <Widget label="Broken links" value={w.brokenLinks ?? 0} tone={w.brokenLinks ? 'bad' : ''} />
            <Widget label="Avg word count" value={w.averageWordCount ?? 0} />
            <Widget label="Critical issues" value={suite.summary?.critical ?? 0} tone="bad" />
          </div>
          {suite.topIssues?.length ? (
            <div className="seo-hub__widget">
              <h3>Top issues</h3>
              <ul className="seo-enterprise__top-issues">
                {suite.topIssues.map((i) => (
                  <li key={i.id}>
                    <code>{i.id}</code> <span>{i.count} pages</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {section !== 'dashboard' && section !== 'reports' ? (
        <div className="seo-enterprise__page-picker">
          <label>
            Page
            <select value={selectedPage?.pageId || ''} onChange={(e) => setSelectedPageId(Number(e.target.value))}>
              {(suite.pages || []).map((p) => (
                <option key={p.pageId} value={p.pageId}>
                  {p.pageName} ({p.score}/100)
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {section === 'keywords' && selectedPage ? (
        <div className="seo-enterprise__module">
          <div className="seo-hub__scores">
            <ScoreRing score={selectedPage.score} label="Page score" />
          </div>
          <p className="proj-seo__hint">
            Focus: <strong>{selectedPage.modules?.keywords?.focusKeyword || '—'}</strong>
            {selectedPage.modules?.keywords?.secondaryKeywords?.length
              ? ` · Secondary: ${selectedPage.modules.keywords.secondaryKeywords.join(', ')}`
              : ''}
          </p>
          {selectedPage.modules?.keywords?.density ? (
            <p className="proj-seo__hint">
              Density: {selectedPage.modules.keywords.density.density}% ({selectedPage.modules.keywords.density.occurrences} occurrences)
            </p>
          ) : null}
          <div className="seo-enterprise__checks">
            {(selectedPage.modules?.keywords?.checks || []).map((c) => (
              <div key={c.id} className={`seo-enterprise__check seo-enterprise__check--${c.status}`}>
                <span>{c.label}</span>
                <span>{c.value ?? (c.ok ? 'OK' : 'Missing')}</span>
              </div>
            ))}
          </div>
          <IssueList issues={selectedPage.modules?.keywords?.issues || []} />
        </div>
      ) : null}

      {section === 'content' && selectedPage ? (
        <div className="seo-enterprise__module">
          <div className="seo-cc__stat-grid">
            <Widget label="Word count" value={selectedPage.modules?.content?.wordCount ?? 0} />
            <Widget label="Reading time" value={`${selectedPage.modules?.content?.readingTimeMinutes ?? 0} min`} />
            <Widget label="H1 count" value={selectedPage.modules?.content?.headings?.h1Count ?? 0} />
          </div>
          {selectedPage.modules?.content?.headings?.outline?.length ? (
            <div className="seo-hub__widget">
              <h3>Heading outline</h3>
              <ul className="seo-enterprise__outline">
                {selectedPage.modules.content.headings.outline.map((h) => (
                  <li key={h.nodeId} style={{ paddingLeft: (h.level - 1) * 12 }}>
                    H{h.level}: {h.text || '(empty)'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <IssueList issues={selectedPage.modules?.content?.issues || []} />
        </div>
      ) : null}

      {section === 'images' && selectedPage ? (
        <div className="seo-enterprise__module">
          <div className="seo-cc__stat-grid">
            <Widget label="Total images" value={selectedPage.modules?.images?.total ?? 0} />
            <Widget label="Missing alt" value={selectedPage.modules?.images?.missingAlt ?? 0} tone="warn" />
            <Widget label="Missing title" value={selectedPage.modules?.images?.missingTitle ?? 0} />
            <Widget label="Large images" value={selectedPage.modules?.images?.largeCount ?? 0} />
          </div>
          {(selectedPage.modules?.images?.missingAltNodes || []).length ? (
            <div className="seo-hub__widget">
              <h3>Images missing alt — bulk fix in Builder</h3>
              <ul className="seo-enterprise__image-list">
                {selectedPage.modules.images.missingAltNodes.map((img) => (
                  <li key={img.id}>
                    <code>#{img.id}</code> {img.name} {img.src ? <span className="proj-seo__hint">({img.src})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="seo-hub__empty">All images have alt text.</p>
          )}
        </div>
      ) : null}

      {section === 'links' && selectedPage ? (
        <div className="seo-enterprise__module">
          <div className="seo-cc__stat-grid">
            <Widget label="Outbound links" value={selectedPage.modules?.links?.outboundCount ?? 0} />
            <Widget label="Inbound links" value={selectedPage.modules?.links?.inboundCount ?? 0} />
            <Widget label="Broken links" value={selectedPage.modules?.links?.broken?.length ?? 0} tone="bad" />
            <Widget label="Orphan page" value={selectedPage.modules?.links?.isOrphan ? 'Yes' : 'No'} tone={selectedPage.modules?.links?.isOrphan ? 'warn' : ''} />
          </div>
          {(selectedPage.modules?.links?.suggestions || []).length ? (
            <div className="seo-hub__widget">
              <h3>Suggestions</h3>
              <ul className="seo-enterprise__suggestions">
                {selectedPage.modules.links.suggestions.map((s, i) => (
                  <li key={`${s.type}-${i}`}>{s.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(selectedPage.modules?.links?.broken || []).length ? (
            <IssueList
              issues={selectedPage.modules.links.broken.map((b) => ({
                id: `broken-${b.path}`,
                severity: 'critical',
                label: `Broken: ${b.href}`,
              }))}
            />
          ) : null}
        </div>
      ) : null}

      {section === 'reports' ? (
        <div className="seo-enterprise__module seo-enterprise__reports">
          <p className="proj-seo__hint">Export a project-wide SEO audit. PDF opens a printable HTML report — use your browser&apos;s Print → Save as PDF.</p>
          <div className="seo-cc__actions">
            <a className="proj-seo__save seo-cc__link-btn" href={exportUrl('csv')} download>
              Export CSV
            </a>
            <a className="proj-seo__save seo-cc__link-btn" href={exportUrl('json')} download>
              Export JSON
            </a>
            <a className="proj-seo__save seo-cc__link-btn" href={exportUrl('html')} download>
              Export HTML
            </a>
            <button type="button" className="proj-seo__save" onClick={openPdfReport}>
              Export PDF (print)
            </button>
          </div>
          <div className="seo-hub__widget">
            <h3>Report includes</h3>
            <ul className="seo-enterprise__report-list">
              <li>Project score and widget summary</li>
              <li>Per-page scores, word count, alt issues, orphan status</li>
              <li>Top recurring issues across the site</li>
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
