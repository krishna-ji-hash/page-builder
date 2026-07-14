'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { blogApi } from '@/components/admin/blog/blogAdminApi';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

export default function AdminBlogSettings({ projectId }) {
  const api = useMemo(() => blogApi(projectId), [projectId]);
  const [form, setForm] = useState({
    postsPerPage: 12,
    showRelated: true,
    defaultAuthorId: '',
    listingSlug: 'blog',
    articleTemplateSlug: 'blog-post',
  });
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [settingsData, authorsData] = await Promise.all([api.getSettings(), api.listAuthors()]);
    const s = settingsData.settings || {};
    setForm({
      postsPerPage: s.postsPerPage ?? 12,
      showRelated: s.showRelated !== false,
      defaultAuthorId: s.defaultAuthorId != null ? String(s.defaultAuthorId) : '',
      listingSlug: s.listingSlug || 'blog',
      articleTemplateSlug: s.articleTemplateSlug || 'blog-post',
    });
    setAuthors(authorsData.authors || []);
  }, [api]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, [load]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await api.saveSettings({
        ...form,
        defaultAuthorId: form.defaultAuthorId ? Number(form.defaultAuthorId) : null,
      });
      setSaved(true);
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="proj-blog proj-blog--cms">
        <p className="proj-blog__empty">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="proj-blog proj-blog--cms">
      <header className="proj-blog__hero-bar">
        <div>
          <p className="proj-blog__eyebrow">Blog CMS</p>
          <h1 className="proj-blog__h1">Blog Settings</h1>
          <p className="proj-blog__lede">
            Listing stays on <code>/blog</code>. Articles render through the shared{' '}
            <code>blog-post</code> template — not one page per article.
          </p>
        </div>
      </header>

      {error ? <div className="platform-alert platform-alert--error">{error}</div> : null}
      {saved ? <div className="platform-alert platform-alert--success">Settings saved.</div> : null}

      <form className="proj-blog__panel" onSubmit={save}>
        <label className="proj-blog__field">
          <span>Posts per page (listing)</span>
          <input
            type="number"
            min={1}
            max={50}
            value={form.postsPerPage}
            onChange={(e) => setForm((prev) => ({ ...prev, postsPerPage: Number(e.target.value) }))}
          />
        </label>
        <label className="proj-blog__field proj-blog__field--row">
          <input
            type="checkbox"
            checked={form.showRelated}
            onChange={(e) => setForm((prev) => ({ ...prev, showRelated: e.target.checked }))}
          />
          <span>Show related articles on post pages</span>
        </label>
        <label className="proj-blog__field">
          <span>Default author</span>
          <select
            value={form.defaultAuthorId}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultAuthorId: e.target.value }))}
          >
            <option value="">None</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="proj-blog__field">
          <span>Listing page slug</span>
          <input
            value={form.listingSlug}
            onChange={(e) => setForm((prev) => ({ ...prev, listingSlug: e.target.value }))}
          />
        </label>
        <label className="proj-blog__field">
          <span>Article template page slug</span>
          <input
            value={form.articleTemplateSlug}
            onChange={(e) => setForm((prev) => ({ ...prev, articleTemplateSlug: e.target.value }))}
          />
        </label>
        <button type="submit" className="proj-blog__btn proj-blog__btn--primary" disabled={busy}>
          Save settings
        </button>
      </form>
    </div>
  );
}
