'use client';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`);
  }
  return data;
}

export function blogApi(projectId) {
  const base = `/api/projects/${projectId}/blog`;
  return {
    listPosts: (qs = '') => fetchJson(`${base}/posts${qs ? `?${qs}` : ''}`),
    getPost: (id) => fetchJson(`${base}/posts/${id}`),
    createPost: (body) =>
      fetchJson(`${base}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    updatePost: (id, body) =>
      fetchJson(`${base}/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    deletePost: (id) => fetchJson(`${base}/posts/${id}`, { method: 'DELETE' }),
    listCategories: () => fetchJson(`${base}/categories`),
    createCategory: (body) =>
      fetchJson(`${base}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    updateCategory: (id, body) =>
      fetchJson(`${base}/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    deleteCategory: (id) => fetchJson(`${base}/categories/${id}`, { method: 'DELETE' }),
    listTags: () => fetchJson(`${base}/tags`),
    createTag: (body) =>
      fetchJson(`${base}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    updateTag: (id, body) =>
      fetchJson(`${base}/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    deleteTag: (id) => fetchJson(`${base}/tags/${id}`, { method: 'DELETE' }),
    listAuthors: () => fetchJson(`${base}/authors`),
    createAuthor: (body) =>
      fetchJson(`${base}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    updateAuthor: (id, body) =>
      fetchJson(`${base}/authors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    deleteAuthor: (id) => fetchJson(`${base}/authors/${id}`, { method: 'DELETE' }),
    getSettings: () => fetchJson(`${base}/settings`),
    saveSettings: (body) =>
      fetchJson(`${base}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  };
}

export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160);
}

export function formatBlogDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived',
};
