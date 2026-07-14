'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { siteBlogPostHref } from '@/lib/siteBlogPosts';
import { adminBlogEditPath, adminBlogPath } from '@/lib/admin/blogAdminRoutes';
import { adminBuilderBlogPostPreviewPath } from '@/lib/builder/adminBuilderRoutes';
import { blogApi, formatBlogDate, STATUS_LABELS } from '@/components/admin/blog/blogAdminApi';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

const EMPTY_STATS = { total: 0, published: 0, draft: 0, scheduled: 0, archived: 0 };

export default function AdminBlogPostsList({ projectId, projectSlug }) {
  const api = useMemo(() => blogApi(projectId), [projectId]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const slug = projectSlug || '';
  const newHref = adminBlogPath({ id: projectId, slug }, 'new', { id: projectId, slug });
  const ensureBlogTemplateHref = `/admin/builder?projectId=${projectId}&pageSlug=blog-post`;

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (categoryId) params.set('categoryId', categoryId);
    if (authorId) params.set('authorId', authorId);
    if (q.trim()) params.set('q', q.trim());
    params.set('limit', '100');

    const [postsData, cats, auths] = await Promise.all([
      api.listPosts(params.toString()),
      api.listCategories(),
      api.listAuthors(),
    ]);
    setPosts(postsData.posts || []);
    setStats(postsData.stats || EMPTY_STATS);
    setCategories(cats.categories || []);
    setAuthors(auths.authors || []);
  }, [api, status, categoryId, authorId, q]);

  useEffect(() => {
    setLoading(true);
    setError('');
    load()
      .catch((e) => setError(e?.message || 'Failed to load posts'))
      .finally(() => setLoading(false));
  }, [load]);

  async function runAction(postId, fn) {
    setBusyId(postId);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="proj-blog proj-blog--cms">
      <header className="proj-blog__hero-bar">
        <div>
          <p className="proj-blog__eyebrow">Blog CMS</p>
          <h1 className="proj-blog__h1">Blog Posts</h1>
          <p className="proj-blog__lede">
            Manage articles for this project. Posts use one shared template at{' '}
            <code>/blog/[slug]</code> — they are not separate Pages records.
          </p>
        </div>
        <Link href={newHref} className="proj-blog__btn proj-blog__btn--primary">
          + Add New Post
        </Link>
      </header>

      {error ? <div className="platform-alert platform-alert--error">{error}</div> : null}

      <div className="proj-blog__stats">
        {[
          ['Total Posts', stats.total],
          ['Published', stats.published],
          ['Drafts', stats.draft],
          ['Scheduled', stats.scheduled],
          ['Archived', stats.archived],
        ].map(([label, value]) => (
          <div key={label} className="proj-blog__stat-card">
            <span className="proj-blog__stat-value">{value}</span>
            <span className="proj-blog__stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="proj-blog__toolbar">
        <input
          className="proj-blog__search"
          type="search"
          placeholder="Search blog posts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={() => load()}>
          Filter
        </button>
      </div>

      <div className="proj-blog__template-card">
        <div>
          <div className="proj-blog__template-top">
            <strong>Blog Article Template</strong>
            <span className="proj-blog__badge-pill is-active">Active</span>
          </div>
          <p>
            Shared layout for every <code>/blog/[slug]</code> post. Edit once in the builder — all articles
            inherit it.
          </p>
          <dl className="proj-blog__template-meta">
            <div>
              <dt>Template slug</dt>
              <dd>
                <code>blog-post</code>
              </dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>
                <code>/blog/[slug]</code>
              </dd>
            </div>
          </dl>
        </div>
        <a className="proj-blog__btn proj-blog__btn--ghost" href={ensureBlogTemplateHref}>
          Open in Builder
        </a>
      </div>

      <div className="proj-blog__table-wrap">
        {loading ? (
          <p className="proj-blog__empty">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="proj-blog__empty">No blog posts yet. Create your first article.</p>
        ) : (
          <table className="proj-blog__table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const editHref = adminBlogEditPath(
                  { id: projectId, slug },
                  post.id,
                  { id: projectId, slug }
                );
                const liveHref = siteBlogPostHref(post.slug);
                const previewHref =
                  post.status === 'published'
                    ? liveHref
                    : adminBuilderBlogPostPreviewPath({ id: projectId, slug }, post.slug, {
                        id: projectId,
                        slug,
                      });
                const busy = busyId === post.id;
                return (
                  <tr key={post.id}>
                    <td>
                      <div className="proj-blog__title-cell">
                        <span
                          className="proj-blog__thumb"
                          style={
                            post.featuredImage
                              ? { backgroundImage: `url(${post.featuredImage})` }
                              : undefined
                          }
                        />
                        <div>
                          <Link href={editHref} className="proj-blog__post-title">
                            {post.title}
                          </Link>
                          <a className="proj-blog__post-slug" href={liveHref} target="_blank" rel="noreferrer">
                            /blog/{post.slug}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      {post.category ? (
                        <span className="proj-blog__cat-pill">{post.category.name}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="proj-blog__author-cell">
                        <span className="proj-blog__avatar">
                          {(post.author?.name || '?').slice(0, 1).toUpperCase()}
                        </span>
                        {post.author?.name || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`proj-blog__status is-${post.status}`}>
                        {STATUS_LABELS[post.status] || post.status}
                      </span>
                    </td>
                    <td className="proj-blog__muted">{formatBlogDate(post.publishedAt)}</td>
                    <td>
                      <div className="proj-blog__actions">
                        <a href={previewHref} target="_blank" rel="noreferrer" title="Preview">
                          Preview
                        </a>
                        <Link href={editHref}>Edit</Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            runAction(post.id, () => api.updatePost(post.id, { action: 'duplicate' }))
                          }
                        >
                          Duplicate
                        </button>
                        {post.status === 'published' ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runAction(post.id, () => api.updatePost(post.id, { action: 'unpublish' }))
                            }
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              runAction(post.id, () => api.updatePost(post.id, { action: 'publish' }))
                            }
                          >
                            Publish
                          </button>
                        )}
                        <button
                          type="button"
                          className="is-danger"
                          disabled={busy}
                          onClick={() => {
                            if (!window.confirm(`Delete “${post.title}”?`)) return;
                            runAction(post.id, () => api.deletePost(post.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
