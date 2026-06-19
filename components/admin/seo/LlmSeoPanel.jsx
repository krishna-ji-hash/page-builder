'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJson, ScoreRing, IssueList } from '@/components/admin/seo/seoShared';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'geo', label: 'GEO', module: 'geo' },
  { id: 'aeo', label: 'AEO', module: 'aeo' },
  { id: 'entities', label: 'Entities', module: 'entity' },
  { id: 'citations', label: 'Citations', module: 'citation' },
  { id: 'readiness', label: 'AI Readiness' },
  { id: 'audit', label: 'LLM Audit' },
  { id: 'generator', label: 'Answer Generator' },
];

const PLATFORMS = [
  { id: 'chatgpt', label: 'ChatGPT', hint: 'FAQ + answers + schema' },
  { id: 'gemini', label: 'Gemini', hint: 'Schema + entities + freshness' },
  { id: 'claude', label: 'Claude', hint: 'Definitions + citations' },
  { id: 'perplexity', label: 'Perplexity', hint: 'Sources + stats + research' },
  { id: 'copilot', label: 'Copilot', hint: 'Schema + FAQ + comparisons' },
];

const BLOCK_TYPES = [
  { id: 'faq', label: 'FAQ blocks', desc: 'Question/answer pairs for accordion + schema' },
  { id: 'definition', label: 'Definition blocks', desc: '“What is…” paragraphs for AEO' },
  { id: 'comparison', label: 'Comparison blocks', desc: 'Vs/alternative content for Copilot' },
  { id: 'summary', label: 'Summary blocks', desc: 'Concise page summary for LLM snippets' },
];

const CITATION_SIGNALS = [
  { key: 'hasStats', label: 'Statistics' },
  { key: 'hasSources', label: 'Sources' },
  { key: 'hasDates', label: 'Dates' },
  { key: 'hasResearch', label: 'Research' },
  { key: 'hasAuthor', label: 'Author' },
];

function ScoreBadge({ grade }) {
  if (!grade) return null;
  return <span className={`seo-llm__grade seo-llm__grade--${grade.tone}`}>{grade.label}</span>;
}

function ScoreBar({ score, label }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad';
  return (
    <div className="seo-llm__bar">
      <div className="seo-llm__bar-head">
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className="seo-llm__bar-track" aria-hidden="true">
        <div className={`seo-llm__bar-fill seo-llm__bar-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CheckList({ checks = [] }) {
  if (!checks.length) return <p className="seo-hub__empty">No checks.</p>;
  return (
    <ul className="seo-enterprise__checks">
      {checks.map((c) => (
        <li key={c.id} className={`seo-enterprise__check seo-enterprise__check--${c.status || 'warning'}`}>
          <span>{c.label}</span>
          {c.count != null ? <span className="seo-llm__meta">{c.count}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function EntityTags({ items = [], keyField = 'name' }) {
  if (!items.length) return <p className="seo-hub__empty">None detected.</p>;
  return (
    <div className="seo-llm__tags">
      {items.map((item, i) => (
        <span key={`${item[keyField]}-${i}`} className="seo-llm__tag">
          {item[keyField] || item.name}
        </span>
      ))}
    </div>
  );
}

function BlockPreview({ output }) {
  if (!output?.blocks?.length) return null;
  return (
    <div className="seo-llm__blocks">
      {output.blocks.map((block, i) => (
        <article key={i} className="seo-llm__block-card">
          <h4>{block.question || block.heading || `Block ${i + 1}`}</h4>
          <p>{block.answer || block.body}</p>
        </article>
      ))}
    </div>
  );
}

export default function LlmSeoPanel({ projectId }) {
  const [section, setSection] = useState('overview');
  const [suite, setSuite] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [genType, setGenType] = useState('faq');
  const [genOutput, setGenOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  const load = useCallback(
    async (soft = false) => {
      if (soft) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const data = await fetchJson(`/api/projects/${projectId}/seo/llm`, { cache: 'no-store' });
        setSuite(data.suite || null);
        setStatus(data.status || null);
        setSelectedPageId((prev) => prev || data.suite?.pages?.[0]?.pageId || null);
      } catch (e) {
        setError(e?.message || 'Failed to load LLM SEO suite');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedPage = useMemo(
    () => (suite?.pages || []).find((p) => p.pageId === selectedPageId) || suite?.pages?.[0] || null,
    [suite, selectedPageId]
  );

  const selectPage = (pageId, nextSection) => {
    setSelectedPageId(pageId);
    if (nextSection) setSection(nextSection);
  };

  const runGenerate = async () => {
    if (!selectedPageId) return;
    setBusy(true);
    setGenError('');
    setGenSuccess('');
    setGenOutput(null);
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', pageId: selectedPageId, type: genType }),
      });
      setGenOutput(data.result);
      setGenSuccess(`${BLOCK_TYPES.find((t) => t.id === genType)?.label || 'Blocks'} ready — review below.`);
    } catch (e) {
      setGenError(e?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const copyOutput = async () => {
    if (!genOutput) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(genOutput, null, 2));
      setGenSuccess('Copied to clipboard.');
    } catch {
      setGenError('Could not copy to clipboard.');
    }
  };

  const applyFaqSchema = async () => {
    if (!selectedPageId || !genOutput?.schema) return;
    setBusy(true);
    setGenError('');
    setGenSuccess('');
    try {
      await fetchJson(`/api/projects/${projectId}/seo/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply-faq', pageId: selectedPageId, schema: genOutput.schema }),
      });
      setGenSuccess('FAQ schema applied to page SEO. Refreshing scores…');
      await load(true);
    } catch (e) {
      setGenError(e?.message || 'Failed to apply FAQ schema');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !suite) {
    return <div className="proj-seo__skeleton" aria-hidden="true" />;
  }

  if (error && !suite) {
    return (
      <p className="platform-alert platform-alert--error" role="alert">
        {error}
      </p>
    );
  }

  if (!suite) return <p className="seo-hub__empty">No LLM SEO data.</p>;

  const m = selectedPage?.modules || {};
  const genMeta = BLOCK_TYPES.find((t) => t.id === genType);

  return (
    <section className={`seo-cc__panel seo-llm${refreshing ? ' seo-llm--refreshing' : ''}`}>
      <header className="seo-enterprise__head">
        <div>
          <div className="seo-llm__title-row">
            <h2 className="seo-enterprise__title">LLM SEO</h2>
            <span className={`seo-llm__status-pill${status?.geminiConfigured ? ' seo-llm__status-pill--on' : ''}`}>
              {status?.geminiConfigured ? 'Gemini AI on' : 'Heuristic mode'}
            </span>
            {suite.projectGrade ? <ScoreBadge grade={suite.projectGrade} /> : null}
          </div>
          <p className="proj-seo__hint">
            Optimize for ChatGPT, Gemini, Claude, Perplexity, and Copilot — GEO, AEO, entities, and citations.
          </p>
        </div>
        <div className="seo-cc__actions">
          <button type="button" className="proj-seo__save" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="seo-llm__toolbar">
        <div className="seo-enterprise__page-picker seo-llm__page-picker">
          <label htmlFor="llm-page-select">Page</label>
          <select
            id="llm-page-select"
            className="seo-cc__input"
            value={selectedPageId || ''}
            onChange={(e) => setSelectedPageId(Number(e.target.value))}
          >
            {(suite.pages || []).map((p) => (
              <option key={p.pageId} value={p.pageId}>
                {p.pageName} — {p.llmScore}/100
              </option>
            ))}
          </select>
        </div>
        {selectedPage ? (
          <p className="seo-llm__page-meta">
            <code>{selectedPage.pagePath}</code>
            {selectedPage.grade ? <ScoreBadge grade={selectedPage.grade} /> : null}
          </p>
        ) : null}
      </div>

      <nav className="seo-enterprise__nav seo-llm__nav" aria-label="LLM SEO modules">
        {SECTIONS.map((s) => {
          const modScore = s.module && selectedPage?.modules?.[s.module]?.score;
          return (
            <button
              key={s.id}
              type="button"
              className={`seo-enterprise__nav-btn${section === s.id ? ' seo-enterprise__nav-btn--active' : ''}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
              {modScore != null ? <span className="seo-llm__nav-score">{modScore}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="seo-llm__content" key={`${section}-${selectedPageId}`}>
        {section === 'overview' ? (
          <div className="seo-enterprise__dashboard">
            <div className="seo-hub__scores">
              <ScoreRing score={suite.projectLlmScore} label="Project LLM score" />
              {selectedPage ? <ScoreRing score={selectedPage.llmScore} label="Page LLM score" /> : null}
              <ScoreRing score={suite.aiReadiness?.average || 0} label="Avg AI readiness" />
            </div>

            {selectedPage ? (
              <div className="seo-llm__module-bars">
                <ScoreBar score={m.geo?.score} label="GEO" />
                <ScoreBar score={m.aeo?.score} label="AEO" />
                <ScoreBar score={m.entity?.score} label="Entities" />
                <ScoreBar score={m.citation?.score} label="Citations" />
              </div>
            ) : null}

            <div className="seo-cc__stat-grid">
              <div className="seo-hub__widget">
                <h3>Critical</h3>
                <p className="seo-hub__stat">{suite.summary?.critical ?? 0}</p>
              </div>
              <div className="seo-hub__widget">
                <h3>Warnings</h3>
                <p className="seo-hub__stat">{suite.summary?.warning ?? 0}</p>
              </div>
              <div className="seo-hub__widget">
                <h3>Pages</h3>
                <p className="seo-hub__stat">{suite.pages?.length ?? 0}</p>
              </div>
            </div>

            {(suite.pages || []).length ? (
              <div className="seo-hub__widget seo-llm__page-table-wrap">
                <h3>Pages by LLM visibility</h3>
                <table className="seo-llm__page-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Score</th>
                      <th>AI avg</th>
                      <th>Issues</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...(suite.pages || [])]
                      .sort((a, b) => (b.llmScore || 0) - (a.llmScore || 0))
                      .map((p) => (
                        <tr key={p.pageId} className={p.pageId === selectedPageId ? 'seo-llm__page-row--active' : ''}>
                          <td>{p.pageName}</td>
                          <td>
                            <strong>{p.llmScore}</strong>
                            {p.grade ? <ScoreBadge grade={p.grade} /> : null}
                          </td>
                          <td>{p.aiReadiness?.average ?? '—'}</td>
                          <td>
                            <span className="seo-llm__issue-count seo-llm__issue-count--bad">{p.summary?.critical || 0}</span>
                            <span className="seo-llm__issue-count seo-llm__issue-count--warn">{p.summary?.warning || 0}</span>
                          </td>
                          <td>
                            <button type="button" className="seo-llm__link-btn" onClick={() => selectPage(p.pageId, 'audit')}>
                              Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {suite.topIssues?.length ? (
              <div className="seo-hub__widget">
                <h3>Top project issues</h3>
                <ul className="seo-enterprise__top-issues">
                  {suite.topIssues.map((t) => (
                    <li key={t.id}>
                      <span>{t.label || t.id}</span>
                      <span className="seo-llm__meta">{t.count} pages</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {section === 'geo' && selectedPage ? (
          <div className="seo-enterprise__module">
            <ScoreBar score={m.geo?.score} label="GEO score" />
            <CheckList checks={m.geo?.checks} />
            <IssueList issues={m.geo?.issues} />
          </div>
        ) : null}

        {section === 'aeo' && selectedPage ? (
          <div className="seo-enterprise__module">
            <ScoreBar score={m.aeo?.score} label="AEO score" />
            <div className="seo-cc__stat-grid">
              <div className="seo-hub__widget">
                <h3>Questions</h3>
                <p className="seo-hub__stat">{m.aeo?.summary?.questions ?? 0}</p>
              </div>
              <div className="seo-hub__widget">
                <h3>Definitions</h3>
                <p className="seo-hub__stat">{m.aeo?.summary?.definitions ?? 0}</p>
              </div>
              <div className="seo-hub__widget">
                <h3>Comparisons</h3>
                <p className="seo-hub__stat">{m.aeo?.summary?.comparisons ?? 0}</p>
              </div>
              <div className="seo-hub__widget">
                <h3>Direct answers</h3>
                <p className="seo-hub__stat">{m.aeo?.summary?.directAnswers ?? 0}</p>
              </div>
            </div>
            <IssueList issues={m.aeo?.issues} />
          </div>
        ) : null}

        {section === 'entities' && selectedPage ? (
          <div className="seo-enterprise__module">
            <ScoreBar score={m.entity?.score} label="Entity score" />
            <div className="seo-llm__entity-grid">
              <div className="seo-hub__widget">
                <h3>Brand</h3>
                <EntityTags items={m.entity?.brand} />
              </div>
              <div className="seo-hub__widget">
                <h3>Services</h3>
                <EntityTags items={m.entity?.service} />
              </div>
              <div className="seo-hub__widget">
                <h3>Industry</h3>
                <EntityTags items={m.entity?.industry} />
              </div>
              <div className="seo-hub__widget">
                <h3>Products</h3>
                <EntityTags items={m.entity?.product} />
              </div>
            </div>
            <IssueList issues={m.entity?.issues} />
          </div>
        ) : null}

        {section === 'citations' && selectedPage ? (
          <div className="seo-enterprise__module">
            <ScoreBar score={m.citation?.score} label="Citation readiness" />
            <div className="seo-llm__signal-grid">
              {CITATION_SIGNALS.map(({ key, label }) => (
                <div
                  key={key}
                  className={`seo-llm__signal${m.citation?.readiness?.[key] ? ' seo-llm__signal--on' : ''}`}
                >
                  {label}
                </div>
              ))}
            </div>
            <IssueList issues={m.citation?.issues} />
          </div>
        ) : null}

        {section === 'readiness' ? (
          <div className="seo-enterprise__module">
            <div className="seo-llm__platform-grid">
              {PLATFORMS.map((p) => {
                const score = selectedPage?.aiReadiness?.[p.id] ?? suite.aiReadiness?.[p.id] ?? 0;
                return (
                  <div key={p.id} className="seo-llm__platform-card">
                    <ScoreRing score={score} label={p.label} />
                    <p className="seo-llm__platform-hint">{p.hint}</p>
                    <ScoreBar score={score} label="Readiness" />
                  </div>
                );
              })}
            </div>
            <p className="proj-seo__hint">
              Project avg {suite.aiReadiness?.average ?? 0}/100 · Page avg {selectedPage?.aiReadiness?.average ?? 0}/100
            </p>
          </div>
        ) : null}

        {section === 'audit' && selectedPage ? (
          <div className="seo-enterprise__module">
            {(selectedPage.audit?.critical?.length || selectedPage.audit?.warnings?.length) ? (
              <div className="seo-llm__audit-actions">
                <button type="button" className="seo-llm__link-btn" onClick={() => setSection('generator')}>
                  Open Answer Generator →
                </button>
              </div>
            ) : null}
            <div className="seo-hub__widget">
              <h3>Critical</h3>
              <IssueList issues={selectedPage.audit?.critical} />
            </div>
            <div className="seo-hub__widget">
              <h3>Warnings</h3>
              <IssueList issues={selectedPage.audit?.warnings} />
            </div>
          </div>
        ) : null}

        {section === 'generator' ? (
          <div className="seo-enterprise__module seo-llm__generator">
            <p className="proj-seo__hint">{genMeta?.desc}</p>
            <div className="seo-llm__gen-toolbar">
              <select
                className="seo-cc__input"
                value={genType}
                onChange={(e) => {
                  setGenType(e.target.value);
                  setGenOutput(null);
                  setGenSuccess('');
                  setGenError('');
                }}
                aria-label="Block type"
              >
                {BLOCK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button type="button" className="proj-seo__save" disabled={busy || !selectedPageId} onClick={runGenerate}>
                {busy ? 'Generating…' : 'Generate'}
              </button>
              {genOutput ? (
                <>
                  <button type="button" className="seo-llm__ghost-btn" onClick={copyOutput}>
                    Copy JSON
                  </button>
                  {genOutput.schema ? (
                    <button type="button" className="proj-seo__save" disabled={busy} onClick={applyFaqSchema}>
                      Apply FAQ schema
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
            {genError ? (
              <p className="platform-alert platform-alert--error" role="alert">
                {genError}
              </p>
            ) : null}
            {genSuccess ? (
              <p className="platform-alert platform-alert--success" role="status">
                {genSuccess}
              </p>
            ) : null}
            <BlockPreview output={genOutput} />
            {genOutput ? (
              <details className="seo-llm__raw">
                <summary>Raw JSON</summary>
                <pre className="seo-llm__output">{JSON.stringify(genOutput, null, 2)}</pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
