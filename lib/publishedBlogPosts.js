/**
 * Resolve blog article data from first-class blog_posts, CMS, published builder pages, and static fallbacks.
 */
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import { resolveSiteBlogPost, getAllSiteBlogPosts } from '@/lib/siteBlogPosts';
import {
  cmsItemToDetailPost,
  cmsItemToWidgetPost,
  loadCmsBlogItems,
} from '@/lib/cmsBlogPosts';
import {
  loadProjectBlogDetailPosts,
  loadPublishedProjectBlogPost,
} from '@/lib/projectBlogPosts';
import { blogPostToDetailPost } from '@/lib/blogCmsMappers';
import {
  dedupePostsBySlug,
  extractWidgetPostsFromPageTree,
  findWidgetPostBySlug,
  widgetPostToDetailPost,
} from '@/lib/publishedBlogPostUtils';

export {
  dedupePostsBySlug,
  extractWidgetPostsFromPageTree,
  findWidgetPostBySlug,
  widgetPostToDetailPost,
} from '@/lib/publishedBlogPostUtils';

/**
 * @param {string} projectSlug
 */
export async function loadPublishedBlogWidgetPosts(projectSlug) {
  const page = await getPublishedPageForPublic(projectSlug, 'blog');
  if (!page?.snapshot_json || !Array.isArray(page.snapshot_json)) return [];
  return dedupePostsBySlug(extractWidgetPostsFromPageTree(page.snapshot_json));
}

function mergeDetailPostsBySlug(primary, secondary) {
  const seen = new Set();
  const out = [];
  for (const post of [...primary, ...secondary]) {
    const slug = String(post?.slug || '').trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(post);
  }
  return out;
}

/**
 * @param {string} slug
 * @param {string} [projectSlug]
 */
export async function resolveBlogPostForDetail(slug, projectSlug) {
  if (projectSlug) {
    const dbPost = await loadPublishedProjectBlogPost(projectSlug, slug);
    if (dbPost) return blogPostToDetailPost(dbPost);
  }

  if (projectSlug) {
    const cmsItems = await loadCmsBlogItems(projectSlug, 'published');
    const cmsWidgetPosts = cmsItems.map(cmsItemToWidgetPost);
    const cmsMatch = findWidgetPostBySlug(cmsWidgetPosts, slug);
    if (cmsMatch) {
      const item = cmsItems.find(
        (row) => String(row.slug || '').toLowerCase() === String(cmsMatch.slug || '').toLowerCase()
      );
      if (item) return cmsItemToDetailPost(item);
    }
  }

  const publishedPosts = projectSlug ? await loadPublishedBlogWidgetPosts(projectSlug) : [];
  const widgetMatch = findWidgetPostBySlug(publishedPosts, slug);
  if (widgetMatch) return widgetPostToDetailPost(widgetMatch);

  const staticPost = resolveSiteBlogPost(slug);
  if (staticPost) return staticPost;

  return null;
}

/**
 * Catalog for related-post rails — blog_posts first, then CMS, widget, static.
 * @param {string} [projectSlug]
 */
export async function loadBlogPostCatalog(projectSlug) {
  const dbPosts = projectSlug ? await loadProjectBlogDetailPosts(projectSlug) : [];
  if (dbPosts.length) {
    const cmsItems = projectSlug ? await loadCmsBlogItems(projectSlug, 'published') : [];
    const cmsPosts = cmsItems.map(cmsItemToDetailPost);
    return mergeDetailPostsBySlug(dbPosts, cmsPosts);
  }

  const cmsItems = projectSlug ? await loadCmsBlogItems(projectSlug, 'published') : [];
  const cmsPosts = cmsItems.map(cmsItemToDetailPost);
  if (cmsPosts.length) {
    const widgetPosts = projectSlug ? await loadPublishedBlogWidgetPosts(projectSlug) : [];
    const widgetDetails = widgetPosts.map((post) => widgetPostToDetailPost(post));
    return mergeDetailPostsBySlug(cmsPosts, widgetDetails);
  }

  const published = projectSlug ? await loadPublishedBlogWidgetPosts(projectSlug) : [];
  if (published.length) {
    return published.map((post) => widgetPostToDetailPost(post));
  }
  return getAllSiteBlogPosts();
}

export { loadCmsBlogWidgetPosts, mergeCmsPostsIntoBlogListingTree } from '@/lib/cmsBlogPosts';
