/**
 * Server loaders for CMS `blog` collection items.
 */
import { getProjectBySlug } from '@/services/builder/builderService';
import { listItemsByCollectionSlug } from '@/services/builder/cmsService';
import { cmsItemToWidgetPost } from '@/lib/cmsBlogPostUtils';

export {
  cmsItemToDetailPost,
  cmsItemToWidgetPost,
  formatCmsBlogPublishedDate,
  mergeCmsPostsIntoBlogListingTree,
} from '@/lib/cmsBlogPostUtils';

/**
 * @param {string} projectSlug
 * @param {'published' | 'draft' | 'all'} [status]
 */
export async function loadCmsBlogItems(projectSlug, status = 'published') {
  const slug = String(projectSlug || '').trim();
  if (!slug) return [];
  const project = await getProjectBySlug(slug);
  if (!project?.id) return [];
  const items = await listItemsByCollectionSlug(project.id, 'blog', {
    status,
    limit: 200,
    sortBy: 'published_at',
    sortDir: 'desc',
  });
  return Array.isArray(items) ? items : [];
}

/**
 * @param {string} projectSlug
 */
export async function loadCmsBlogWidgetPosts(projectSlug) {
  const items = await loadCmsBlogItems(projectSlug, 'published');
  return items.map(cmsItemToWidgetPost);
}
