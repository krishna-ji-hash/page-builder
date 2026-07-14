/**
 * Ensure the builder template page for /blog/[slug] article styling exists.
 */
import { buildBlogDetailPageSectionRow } from '@/lib/blogDetailPageTemplates.js';
import { flattenTemplateToBulkNodes } from '@/lib/sectionTemplates.js';
import {
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_TITLE,
  isBlogPostTemplatePage,
} from '@/lib/blogPostTemplatePage.js';
import {
  createNodesBulk,
  createPageForProject,
  listPagesByProject,
} from '@/services/builder/builderService.js';

export { BLOG_POST_TEMPLATE_SLUG, BLOG_POST_TEMPLATE_TITLE, isBlogPostTemplatePage };

export async function findBlogPostTemplatePage(projectId) {
  const pages = await listPagesByProject(projectId);
  return pages.find((page) => isBlogPostTemplatePage(page)) || null;
}

/**
 * Create blog-post page with one full blog detail widget when missing.
 * @returns {Promise<{ page: object, created: boolean }>}
 */
export async function ensureBlogPostTemplatePage(projectId) {
  const existing = await findBlogPostTemplatePage(projectId);
  if (existing) {
    const pages = await listPagesByProject(projectId);
    const fresh = pages.find((p) => Number(p.id) === Number(existing.id)) || existing;
    return { page: fresh, created: false };
  }

  const page = await createPageForProject(projectId, {
    title: BLOG_POST_TEMPLATE_TITLE,
    slug: BLOG_POST_TEMPLATE_SLUG,
    createStarter: false,
  });

  const templateRoots = [buildBlogDetailPageSectionRow()];
  const bulkNodes = flattenTemplateToBulkNodes(templateRoots, 0);
  if (bulkNodes.length) {
    await createNodesBulk(page.id, bulkNodes);
  }

  const pages = await listPagesByProject(projectId);
  const createdPage = pages.find((p) => Number(p.id) === Number(page.id)) || page;
  return { page: createdPage, created: true };
}
