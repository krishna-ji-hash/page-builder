'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '@/components/admin/seo/seoShared';

const GENERATORS = [
  { id: 'title', label: 'AI Title', desc: 'SEO title from page content' },
  { id: 'description', label: 'AI Meta', desc: '120–160 character description' },
  { id: 'keywords', label: 'AI Keywords', desc: 'Focus, secondary, long-tail' },
  { id: 'faq', label: 'AI FAQ Schema', desc: 'FAQPage JSON-LD from content' },
  { id: 'schema', label: 'AI Schema', desc: 'WebPage, Service, FAQ, etc.' },
];

const SCHEMA_TYPES = ['WebPage', 'Service', 'Organization', 'FAQ', 'Article', 'BlogPosting', 'LocalBusiness'];

const DISPATCH_PRESETS = [
  'logistics',
  'courier',
  'shipping',
  'ndr',
  'cod',
  'tracking',
  'warehouse',
  'fulfillment',
];

const FIXES = [
  { id: 'title', label: 'Missing title' },
  { id: 'description', label: 'Missing description' },
  { id: 'canonical', label: 'Missing canonical' },
  { id: 'schema', label: 'Missing schema' },
  { id: 'og-image', label: 'Missing OG image' },
  { id: 'keywords', label: 'Missing keywords' },
  { id: 'faq', label: 'Add FAQ schema' },
];

export default function AiSeoAutomation({ projectId, pages = [] }) {
  const [status, setStatus] = useState(null);
  const [pageId, setPageId] = useState(pages[0]?.id || null);
  const [presetId, setPresetId] = useState('shipping');
  const [schemaType, setSchemaType] = useState('WebPage');
  const [output, setOutput] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/ai`, { cache: 'no-store' });
      setStatus(data.ai);
    } catch {
      setStatus({ geminiConfigured: false });
    }
  }, [projectId]);

  const loadSuggestions = useCallback(async () => {
    if (!pageId) return;
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/ai?mode=suggestions&pageId=${pageId}`, {
        cache: 'no-store',
      });
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions(null);
    }
  }, [projectId, pageId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (pages.length && !pageId) setPageId(pages[0].id);
  }, [pages, pageId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const runGenerate = async (type) => {
    if (!pageId) return;
    setBusy(true);
    clearFeedback();
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', pageId, type, presetId, schemaType }),
      });
      setOutput(data.result);
      setSuccess(`${GENERATORS.find((g) => g.id === type)?.label || 'Content'} generated — review and apply below.`);
    } catch (e) {
      setError(e?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const applyOutput = async () => {
    if (!pageId || !output) return;
    const patch = {};
    if (output.title) patch.title = output.title;
    if (output.description) patch.description = output.description;
    if (output.focusKeyword) patch.focusKeyword = output.focusKeyword;
    if (output.secondaryKeywords) patch.secondaryKeywords = output.secondaryKeywords;
    if (Array.isArray(output.longTailKeywords) && output.longTailKeywords.length) {
      patch.secondaryKeywords = [...new Set([...(patch.secondaryKeywords || []), ...output.longTailKeywords])];
    }
    if (output.schemaType) patch.schemaType = output.schemaType;
    if (output.schema) patch.schemaTemplate = output.schema;
    if (!Object.keys(patch).length) return;

    setBusy(true);
    clearFeedback();
    try {
      await fetchJson(`/api/projects/${projectId}/seo/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply-generated', pageId, seo: patch }),
      });
      setOutput(null);
      setSuccess('Generated SEO saved to page.');
      await loadSuggestions();
    } catch (e) {
      setError(e?.message || 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  const runFix = async (fixType) => {
    if (!pageId) return;
    setBusy(true);
    clearFeedback();
    try {
      await fetchJson(`/api/projects/${projectId}/seo/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix', pageId, fixType, presetId, schemaType }),
      });
      const label = FIXES.find((f) => f.id === fixType)?.label || fixType;
      setSuccess(`${label} applied to page SEO.`);
      await loadSuggestions();
    } catch (e) {
      setError(e?.message || 'Fix failed');
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async (operation) => {
    setBusy(true);
    clearFeedback();
    setBulkResult(null);
    try {
      const data = await fetchJson(`/api/projects/${projectId}/seo/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', operation, presetId, schemaType }),
      });
      setBulkResult(data.result);
      const { succeeded = 0, processed = 0 } = data.result || {};
      if (processed === 0) {
        setSuccess('Bulk run complete — no pages needed this fix.');
      } else {
        setSuccess(`Bulk complete — ${succeeded}/${processed} fixes applied.`);
      }
    } catch (e) {
      setError(e?.message || 'Bulk optimization failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="seo-cc__panel seo-ai">
      <header className="seo-enterprise__head">
        <div>
          <h2 className="seo-enterprise__title">AI SEO Automation</h2>
          <p className="proj-seo__hint">
            {status?.geminiConfigured
              ? `Gemini connected (${status.model}) — AI + heuristic fallback`
              : 'Heuristic mode — set GEMINI_API_KEY in .env for Gemini AI'}
          </p>
        </div>
      </header>

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="platform-alert platform-alert--success" role="status">
          {success}
        </p>
      ) : null}

      <div className="seo-ai__toolbar">
        <div className="proj-seo__field seo-ai__field">
          <label htmlFor="seo-ai-page">Page</label>
          <select
            id="seo-ai-page"
            className="seo-cc__input seo-ai__select"
            value={pageId || ''}
            onChange={(e) => setPageId(Number(e.target.value))}
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="proj-seo__field seo-ai__field">
          <label htmlFor="seo-ai-preset">Dispatch preset</label>
          <select
            id="seo-ai-preset"
            className="seo-cc__input seo-ai__select"
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
          >
            {DISPATCH_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="proj-seo__field seo-ai__field">
          <label htmlFor="seo-ai-schema">Schema type</label>
          <select
            id="seo-ai-schema"
            className="seo-cc__input seo-ai__select"
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value)}
          >
            {SCHEMA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="seo-ai__grid">
        <div className="seo-hub__widget">
          <h3>Generators</h3>
          <div className="seo-ai__actions">
            {GENERATORS.map((g) => (
              <button key={g.id} type="button" className="proj-seo__save" disabled={busy || !pageId} onClick={() => runGenerate(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          <p className="proj-seo__hint">Meta descriptions target 120–160 characters.</p>
        </div>

        <div className="seo-hub__widget">
          <h3>One-click AI fixes</h3>
          <div className="seo-ai__actions">
            {FIXES.map((f) => (
              <button key={f.id} type="button" className="proj-seo__save proj-seo__save--ghost" disabled={busy || !pageId} onClick={() => runFix(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="seo-hub__widget">
          <h3>Bulk optimization</h3>
          <div className="seo-ai__actions">
            <button type="button" className="proj-seo__save" disabled={busy} onClick={() => runBulk('titles')}>
              All missing titles
            </button>
            <button type="button" className="proj-seo__save" disabled={busy} onClick={() => runBulk('descriptions')}>
              All missing descriptions
            </button>
            <button type="button" className="proj-seo__save" disabled={busy} onClick={() => runBulk('schemas')}>
              All missing schemas
            </button>
            <button type="button" className="proj-seo__save" disabled={busy} onClick={() => runBulk('all')}>
              Run all fixes
            </button>
          </div>
          {bulkResult ? (
            <p className="proj-seo__hint">
              Bulk {bulkResult.operation}: {bulkResult.succeeded}/{bulkResult.processed} succeeded
              {bulkResult.processed ? ` (${bulkResult.geminiAvailable ? 'AI' : 'heuristic'})` : ''}
            </p>
          ) : null}
        </div>
      </div>

      {output ? (
        <div className="seo-hub__widget seo-ai__output">
          <h3>
            Generated <span className="seo-ai__source">({output.source})</span>
          </h3>
          <pre className="seo-cc__schema-json">{JSON.stringify(output, null, 2)}</pre>
          <div className="seo-cc__actions">
            <button type="button" className="proj-seo__save" onClick={applyOutput} disabled={busy}>
              Apply to page SEO
            </button>
            <button type="button" className="proj-seo__save proj-seo__save--ghost" onClick={() => setOutput(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {suggestions ? (
        <div className="seo-ai__suggestions">
          <div className="seo-hub__widget">
            <h3>Related keywords</h3>
            <ul>{suggestions.relatedKeywords?.map((k) => <li key={k}>{k}</li>)}</ul>
          </div>
          <div className="seo-hub__widget">
            <h3>Internal link suggestions</h3>
            <ul>{suggestions.internalLinkSuggestions?.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="seo-hub__widget">
            <h3>FAQ suggestions</h3>
            <ul>{suggestions.faqSuggestions?.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="seo-hub__widget">
            <h3>Blog topic ideas</h3>
            <ul>{suggestions.blogTopics?.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
