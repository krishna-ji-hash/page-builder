'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { blogApi } from '@/components/admin/blog/blogAdminApi';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

const EMPTY = { id: null, name: '', designation: '', bio: '', avatar: '' };

export default function AdminBlogAuthors({ projectId }) {
  const api = useMemo(() => blogApi(projectId), [projectId]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await api.listAuthors();
    setItems(data.authors || []);
  }, [api]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e?.message || 'Failed to load authors'))
      .finally(() => setLoading(false));
  }, [load]);

  function reset() {
    setForm(EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        designation: form.designation,
        bio: form.bio,
        avatar: form.avatar,
      };
      if (form.id) await api.updateAuthor(form.id, payload);
      else await api.createAuthor(payload);
      reset();
      await load();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete author “${item.name}”?`)) return;
    setBusy(true);
    try {
      await api.deleteAuthor(item.id);
      if (form.id === item.id) reset();
      await load();
    } catch (err) {
      setError(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="proj-blog proj-blog--cms">
      <header className="proj-blog__hero-bar">
        <div>
          <p className="proj-blog__eyebrow">Blog CMS</p>
          <h1 className="proj-blog__h1">Authors</h1>
          <p className="proj-blog__lede">Authors shown on article pages and in the posts table.</p>
        </div>
      </header>

      {error ? <div className="platform-alert platform-alert--error">{error}</div> : null}

      <div className="proj-blog__split">
        <form className="proj-blog__panel" onSubmit={save}>
          <h2 className="proj-blog__panel-title">{form.id ? 'Edit' : 'Add'} author</h2>
          <label className="proj-blog__field">
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label className="proj-blog__field">
            <span>Designation</span>
            <input
              value={form.designation}
              onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
            />
          </label>
          <label className="proj-blog__field">
            <span>Bio</span>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </label>
          <label className="proj-blog__field">
            <span>Avatar URL</span>
            <input
              value={form.avatar}
              onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
            />
          </label>
          <div className="proj-blog__hero-actions">
            {form.id ? (
              <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={reset}>
                Cancel
              </button>
            ) : null}
            <button type="submit" className="proj-blog__btn proj-blog__btn--primary" disabled={busy}>
              {form.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>

        <div className="proj-blog__panel">
          <h2 className="proj-blog__panel-title">All authors</h2>
          {loading ? (
            <p className="proj-blog__empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="proj-blog__empty">No authors yet.</p>
          ) : (
            <ul className="proj-blog__simple-list">
              {items.map((item) => (
                <li key={item.id}>
                  <div className="proj-blog__author-cell">
                    <span className="proj-blog__avatar">{item.name.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{item.name}</strong>
                      {item.designation ? <div className="proj-blog__muted">{item.designation}</div> : null}
                    </div>
                  </div>
                  <div className="proj-blog__actions">
                    <button type="button" onClick={() => setForm({ ...item })}>
                      Edit
                    </button>
                    <button type="button" className="is-danger" onClick={() => remove(item)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
