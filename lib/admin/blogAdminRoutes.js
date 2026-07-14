/** Blog admin path helpers (nested under project Blog section). */

import {
  adminActivePathOpts,
  adminFlatProjectSectionPath,
  adminProjectSectionPath,
} from '@/lib/admin/adminRoutes';

export const BLOG_NAV_ITEMS = Object.freeze([
  { id: 'posts', label: 'All Posts', path: '' },
  { id: 'new', label: 'Add New Post', path: 'new' },
  { id: 'categories', label: 'Categories', path: 'categories' },
  { id: 'tags', label: 'Tags', path: 'tags' },
  { id: 'authors', label: 'Authors', path: 'authors' },
  { id: 'settings', label: 'Blog Settings', path: 'settings' },
]);

export function adminFlatBlogPath(sub = '') {
  const base = adminFlatProjectSectionPath('blog');
  const s = String(sub || '')
    .replace(/^\/+|\/+$/g, '')
    .trim();
  return s ? `${base}/${s}` : base;
}

export function adminProjectBlogPath(projectRef, sub = '', opts = {}) {
  const base = adminProjectSectionPath(projectRef, 'blog', opts);
  const s = String(sub || '')
    .replace(/^\/+|\/+$/g, '')
    .trim();
  return s ? `${base}/${s}` : base;
}

export function adminBlogPath(projectRef, sub = '', activeProject = null) {
  return adminProjectBlogPath(projectRef, sub, adminActivePathOpts(activeProject));
}

export function adminBlogEditPath(projectRef, postId, activeProject = null) {
  return adminBlogPath(projectRef, `${postId}/edit`, activeProject);
}

export function parseBlogSubFromSegments(segmentsAfterBlog) {
  const parts = Array.isArray(segmentsAfterBlog) ? segmentsAfterBlog : [];
  if (!parts.length) return { view: 'posts' };
  if (parts[0] === 'new') return { view: 'new' };
  if (parts[0] === 'categories') return { view: 'categories' };
  if (parts[0] === 'tags') return { view: 'tags' };
  if (parts[0] === 'authors') return { view: 'authors' };
  if (parts[0] === 'settings') return { view: 'settings' };
  if (parts[1] === 'edit' && parts[0]) {
    return { view: 'edit', postId: parts[0] };
  }
  return { view: 'posts' };
}
