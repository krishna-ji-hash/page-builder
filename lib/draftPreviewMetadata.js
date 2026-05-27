import { getPageIdByProjectAndPageSlug, getDraftPageForBuilder } from '@/services/builder/builderService';
import { isPublicSlug } from '@/lib/routeParams';
import { publicPagePathForSeo } from '@/lib/publicSiteUrls';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';

/** Draft preview tab title / OG — same SEO resolver as published, draft page row + config. */
export async function buildDraftPreviewMetadata(projectSlug, pageSlug) {
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    return {};
  }
  const pageId = await getPageIdByProjectAndPageSlug(projectSlug, pageSlug);
  if (!pageId) return {};
  const state = await getDraftPageForBuilder(pageId);
  if (!state?.page) return {};

  const currentPath = publicPagePathForSeo(projectSlug, pageSlug);
  const { metadata } = resolveSeoMetadata({
    projectConfig: state.page.projectConfig,
    pageName: state.page.title,
    currentPath,
    pageSeo: state.page.seo,
  });
  return metadata;
}
