'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEO_SCHEMA_TYPES } from '@/lib/seo/seoConstants';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function safeSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

const EMPTY_POST = {
  title: '',
  slug: '',
  excerpt: '',
  featuredImage: '',
  content: '',
  status: 'draft',
  category: '',
  tags: '',
  author: '',
  seo: {
    title: '',
    description: '',
    focusKeyword: '',
    canonicalUrl: '',
    ogImage: '',
    schemaType: 'BlogPosting',
    noindex: false,
  },
};

export default function AdminProjectBlog({ projectId }) {
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_POST);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of posts) {
      const cat = p.data?.category;
      if (cat) set.add(cat);
    }
    return [...set].sort();
  }, [posts]);

  const authors = useMemo(() => {
    const set = new Set();
    for (const p of posts) {
      const a = p.data?.author;
      if (a) set.add(a);
    }
    return [...set].sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        String(p.title || '').toLowerCase().includes(q) ||
        String(p.slug || '').toLowerCase().includes(q) ||
        String(p.data?.category || '').toLowerCase().includes(q)
    );
  }, [posts, query]);

  const loadPosts = useCallback(async () => {
    const pid = Number(projectId);
    const [itemsData, projectsData] = await Promise.all([
      fetchJson(`/api/projects/${projectId}/cms/collections/blog/items?status=all&limit=100`),
      fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
    ]);
    setProject((projectsData.projects || []).find((p) => Number(p.id) === pid) || null);
    setPosts(Array.isArray(itemsData.items) ? itemsData.items : []);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadPosts()
      .catch((e) => setError(e?.message || 'Failed to load blog'))
      .finally(() => setLoading(false));
  }, [loadPosts]);

  const ensureBlogCollection = async () => {
    await fetchJson(`/api/projects/${projectId}/cms/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Blog',
        slug: 'blog',
        type: 'blog',
        schema: {
          fields: [
            { id: 'excerpt', type: 'text' },
            { id: 'content', type: 'richtext' },
            { id: 'featuredImage', type: 'image' },
            { id: 'category', type: 'text' },
            { id: 'tags', type: 'json' },
            { id: 'author', type: 'text' },
          ],
        },
      }),
    });
  };

  const openPost = (post) => {
    setActiveId(post.id);
    const seo = post.seo || {};
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.data?.excerpt || '',
      featuredImage: post.data?.featuredImage || '',
      content: post.data?.content || '',
      status: post.status || 'draft',
      category: post.data?.category || '',
      tags: Array.isArray(post.data?.tags) ? post.data.tags.join(', ') : '',
      author: post.data?.author || '',
      seo: {
        title: seo.title || '',
        description: seo.description || '',
        focusKeyword: seo.focusKeyword || '',
        canonicalUrl: seo.canonicalUrl || '',
        ogImage: seo.ogImage || '',
        schemaType: seo.schemaType || 'BlogPosting',
        noindex: Boolean(seo.noindex),
      },
    });
  };

  const newPost = () => {
    setActiveId('new');
    setForm({ ...EMPTY_POST, slug: '', title: '' });
  };

  const savePost = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = {
        status: form.status === 'published' ? 'published' : 'draft',
        title: form.title,
        slug: safeSlug(form.slug || form.title),
        data: {
          excerpt: form.excerpt,
          content: form.content,
          featuredImage: form.featuredImage,
          category: form.category,
          tags: form.tags
            .split(/[,;]+/)
            .map((t) => t.trim())
            .filter(Boolean),
          author: form.author,
        },
        seo: form.seo,
      };

      if (activeId === 'new') {
        try {
          await fetchJson(`/api/projects/${projectId}/cms/collections/blog/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          if (String(e.message).includes('Collection not found')) {
            await ensureBlogCollection();
            await fetchJson(`/api/projects/${projectId}/cms/collections/blog/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } else throw e;
        }
      } else {
        await fetchJson(`/api/projects/${projectId}/cms/collections/blog/items/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await loadPosts();
      setActiveId(null);
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="proj-blog">
      <header className="proj-blog__hero">
        <div>
          <p className="proj-blog__badge">Workspace · Blog</p>
          <h1 className="proj-blog__title">Blog posts</h1>
          <p className="proj-blog__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — posts at <code>/blog</code> and <code>/blog/[slug]</code>
              </>
            ) : (
              'Manage blog posts, categories, tags, and SEO.'
            )}
          </p>
        </div>
        <button type="button" className="proj-blog__btn" onClick={newPost} disabled={busy}>
          New post
        </button>
      </header>

      {error ? (
        <p className="platform-alert platform-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <div className="proj-blog__skeleton" /> : null}

      {!loading ? (
        <div className="proj-blog__layout">
          <aside className="proj-blog__sidebar">
            <input
              className="proj-blog__search"
              placeholder="Search posts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="proj-blog__list">
              {filtered.map((post) => (
                <li key={post.id}>
                  <button type="button" className={activeId === post.id ? 'is-active' : ''} onClick={() => openPost(post)}>
                    <strong>{post.title || post.slug}</strong>
                    <span>{post.status}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="proj-blog__meta">
              <h3>Categories</h3>
              <p>{categories.length ? categories.join(', ') : '—'}</p>
              <h3>Authors</h3>
              <p>{authors.length ? authors.join(', ') : '—'}</p>
            </div>
          </aside>

          {activeId ? (
            <div className="proj-blog__editor">
              <h2>{activeId === 'new' ? 'New post' : 'Edit post'}</h2>
              <div className="proj-blog__fields">
                <label>
                  Title
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </label>
                <label>
                  Slug
                  <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder={safeSlug(form.title)} />
                </label>
                <label>
                  Excerpt
                  <textarea rows={2} value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} />
                </label>
                <label>
                  Featured image URL
                  <input value={form.featuredImage} onChange={(e) => setForm((p) => ({ ...p, featuredImage: e.target.value }))} />
                </label>
                <label>
                  Content
                  <textarea rows={8} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
                </label>
                <label>
                  Category
                  <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                </label>
                <label>
                  Tags (comma-separated)
                  <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
                </label>
                <label>
                  Author
                  <input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} />
                </label>
                <label>
                  Status
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <section className="proj-blog__seo">
                <h3>SEO</h3>
                <div className="proj-blog__fields">
                  <label>
                    Meta title
                    <input
                      value={form.seo.title}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, title: e.target.value } }))}
                      placeholder="{{title}} | {{siteTitle}}"
                    />
                  </label>
                  <label>
                    Meta description
                    <textarea
                      rows={2}
                      value={form.seo.description}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, description: e.target.value } }))}
                    />
                  </label>
                  <label>
                    Focus keyword
                    <input
                      value={form.seo.focusKeyword}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, focusKeyword: e.target.value } }))}
                    />
                  </label>
                  <label>
                    Canonical URL
                    <input
                      value={form.seo.canonicalUrl}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, canonicalUrl: e.target.value } }))}
                    />
                  </label>
                  <label>
                    OG image
                    <input
                      value={form.seo.ogImage}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, ogImage: e.target.value } }))}
                    />
                  </label>
                  <label>
                    Schema
                    <select
                      value={form.seo.schemaType}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, schemaType: e.target.value } }))}
                    >
                      {SEO_SCHEMA_TYPES.filter((t) => ['Article', 'BlogPosting', 'WebPage'].includes(t)).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="proj-blog__check">
                    <input
                      type="checkbox"
                      checked={form.seo.noindex}
                      onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, noindex: e.target.checked } }))}
                    />
                    noindex
                  </label>
                </div>
              </section>

              <div className="proj-blog__actions">
                <button type="button" className="proj-blog__btn" onClick={savePost} disabled={busy}>
                  {busy ? 'Saving…' : 'Save post'}
                </button>
                <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={() => setActiveId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="proj-blog__empty">Select a post or create a new one.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
