/**
 * Load first-class blog_posts for a project (public + admin bridges).
 */
import { getProjectBySlug } from '@/services/builder/builderService';
import {
  blogPostToDetailPost,
  blogPostToWidgetPost,
  getBlogPostBySlug,
  listPublishedBlogPosts,
} from '@/services/blog/blogService';

export { blogPostToDetailPost, blogPostToWidgetPost } from '@/lib/blogCmsMappers';

/**
 * @param {string} projectSlug
 * @param {object} [opts]
 */
export async function loadProjectBlogPosts(projectSlug, opts = {}) {
  const slug = String(projectSlug || '').trim();
  if (!slug) return [];
  const project = await getProjectBySlug(slug);
  if (!project?.id) return [];
  const { posts } = await listPublishedBlogPosts(project.id, {
    limit: opts.limit || 200,
    q: opts.q || '',
    categoryId: opts.categoryId,
  });
  return posts;
}

/**
 * @param {string} projectSlug
 * @param {string} postSlug
 */
export async function loadPublishedProjectBlogPost(projectSlug, postSlug) {
  const slug = String(projectSlug || '').trim();
  if (!slug || !postSlug) return null;
  const project = await getProjectBySlug(slug);
  if (!project?.id) return null;
  const post = await getBlogPostBySlug(project.id, postSlug, { status: 'published' });
  // Private posts never resolve on the public site (even if status=published).
  if (post && String(post.visibility || 'public') === 'private') return null;
  return post;
}

export async function loadProjectBlogWidgetPosts(projectSlug, opts = {}) {
  const posts = await loadProjectBlogPosts(projectSlug, opts);
  return posts
    .filter((p) => String(p.visibility || 'public') === 'public')
    .map(blogPostToWidgetPost)
    .filter(Boolean);
}

export async function loadProjectBlogDetailPosts(projectSlug, opts = {}) {
  const posts = await loadProjectBlogPosts(projectSlug, opts);
  return posts
    .filter((p) => String(p.visibility || 'public') !== 'private')
    .map(blogPostToDetailPost)
    .filter(Boolean);
}
