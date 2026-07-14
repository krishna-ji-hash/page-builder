'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { blogApi, slugify } from '@/components/admin/blog/blogAdminApi';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

/**
 * Shared CRUD UI for categories or tags.
 * @param {{ projectId: number|string, kind: 'categories' | 'tags' }} props
 */
export default function AdminBlogTaxonomy({ projectId, kind }) {
  const api = useMemo(() => blogApi(projectId), [projectId]);
  const isCategory = kind === 'categories';
  const title = isCategory ? 'Categories' : 'Tags';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', slug: '', description: '' });
  const [slugManual, setSlugManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = isCategory ? await api.listCategories() : await api.listTags();
    setItems(isCategory ? data.categories || [] : data.tags || []);
  }, [api, isCategory]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [load]);

  function reset() {
    setForm({ id: null, name: '', slug: '', description: '' });
    setSlugManual(false);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        ...(isCategory ? { description: form.description } : {}),
      };
      if (form.id) {
        if (isCategory) await api.updateCategory(form.id, payload);
        else await api.updateTag(form.id, payload);
      } else if (isCategory) {
        await api.createCategory(payload);
      } else {
        await api.createTag(payload);
      }
      reset();
      await load();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    setBusy(true);
    setError('');
    try {
      if (isCategory) await api.deleteCategory(item.id);
      else await api.deleteTag(item.id);
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
          <h1 className="proj-blog__h1">{title}</h1>
          <p className="proj-blog__lede">
            Project-scoped {title.toLowerCase()} used when editing blog posts.
          </p>
        </div>
      </header>

      {error ? <div className="platform-alert platform-alert--error">{error}</div> : null}

      <div className="proj-blog__split">
        <form className="proj-blog__panel" onSubmit={save}>
          <h2 className="proj-blog__panel-title">{form.id ? 'Edit' : 'Add'} {isCategory ? 'category' : 'tag'}</h2>
          <label className="proj-blog__field">
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugManual ? prev.slug : slugify(name),
                }));
              }}
            />
          </label>
          <label className="proj-blog__field">
            <span>Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
            />
          </label>
          {isCategory ? (
            <label className="proj-blog__field">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
          ) : null}
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
          <h2 className="proj-blog__panel-title">All {title.toLowerCase()}</h2>
          {loading ? (
            <p className="proj-blog__empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="proj-blog__empty">None yet.</p>
          ) : (
            <ul className="proj-blog__simple-list">
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span className="proj-blog__muted">/{item.slug}</span>
                  </div>
                  <div className="proj-blog__actions">
                    <button
                      type="button"
                      onClick={() => {
                        setSlugManual(true);
                        setForm({
                          id: item.id,
                          name: item.name,
                          slug: item.slug,
                          description: item.description || '',
                        });
                      }}
                    >
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
