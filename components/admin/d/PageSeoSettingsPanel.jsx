'use client';

import { useCallback, useEffect, useState } from 'react';

const emptySeoForm = {
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImage: '',
  robotsIndex: true,
  robotsFollow: true,
  canonicalUrl: '',
};

/**
 * Inline page SEO settings — loads/saves via PUT /api/admin/pages/[pageId].
 */
export default function PageSeoSettingsPanel({ pageId, pageTitle, onClose }) {
  const [form, setForm] = useState(emptySeoForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load page SEO');
      const page = data.page || {};
      setForm({
        seoTitle: page.seoTitle || '',
        seoDescription: page.seoDescription || '',
        seoKeywords: page.seoKeywords || '',
        ogImage: page.ogImage || '',
        robotsIndex: page.robotsIndex !== false,
        robotsFollow: page.robotsFollow !== false,
        canonicalUrl: page.canonicalUrl || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoTitle: form.seoTitle.trim() || null,
          seoDescription: form.seoDescription.trim() || null,
          seoKeywords: form.seoKeywords.trim() || null,
          ogImage: form.ogImage.trim() || null,
          robotsIndex: form.robotsIndex,
          robotsFollow: form.robotsFollow,
          canonicalUrl: form.canonicalUrl.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save SEO');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="proj-pages__seo-panel" aria-labelledby={`page-seo-${pageId}`}>
      <div className="proj-pages__seo-head">
        <h3 id={`page-seo-${pageId}`} className="proj-pages__seo-title">
          SEO — {pageTitle}
        </h3>
        <button type="button" className="proj-pages__btn" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? <p className="proj-pages__seo-hint">Loading SEO fields…</p> : null}
      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <form className="proj-pages__seo-form" onSubmit={(e) => void handleSave(e)}>
          <label className="proj-pages__seo-field">
            <span>SEO title</span>
            <input
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
              placeholder={pageTitle || 'Page title'}
            />
          </label>
          <label className="proj-pages__seo-field">
            <span>Meta description</span>
            <textarea
              rows={3}
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
              placeholder="Short summary for search results"
            />
          </label>
          <label className="proj-pages__seo-field">
            <span>Keywords</span>
            <input
              value={form.seoKeywords}
              onChange={(e) => setForm((f) => ({ ...f, seoKeywords: e.target.value }))}
              placeholder="keyword one, keyword two"
            />
          </label>
          <label className="proj-pages__seo-field">
            <span>Open Graph image URL</span>
            <input
              value={form.ogImage}
              onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
              placeholder="https://example.com/og.jpg"
            />
          </label>
          <label className="proj-pages__seo-field">
            <span>Canonical URL</span>
            <input
              value={form.canonicalUrl}
              onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
              placeholder="https://example.com/page"
            />
          </label>
          <div className="proj-pages__seo-checks">
            <label className="proj-pages__seo-check">
              <input
                type="checkbox"
                checked={form.robotsIndex}
                onChange={(e) => setForm((f) => ({ ...f, robotsIndex: e.target.checked }))}
              />
              <span>Index (robots)</span>
            </label>
            <label className="proj-pages__seo-check">
              <input
                type="checkbox"
                checked={form.robotsFollow}
                onChange={(e) => setForm((f) => ({ ...f, robotsFollow: e.target.checked }))}
              />
              <span>Follow links</span>
            </label>
          </div>
          <div className="proj-pages__seo-actions">
            <button type="submit" className="proj-pages__btn proj-pages__btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save SEO'}
            </button>
            {saved ? (
              <span className="proj-pages__seo-saved" role="status">
                Saved
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
