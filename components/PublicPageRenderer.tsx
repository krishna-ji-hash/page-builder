import PublicSitePageView from '@/lib/publicSitePage';
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import PublicPageLiveTreeView from '@/components/public/PublicPageLiveTreeView';
import PublicPageSectionsFallback from '@/components/public/PublicPageSectionsFallback';
import PublicPageBlocksFallback from '@/components/public/PublicPageBlocksFallback';
import {
  extractPublishedNodes,
  normalizePublishedSections,
  resolvePublishedRenderMode,
} from '@/lib/site/publishedContentFormat';

export type { SectionRecord } from '@/components/public/PublicPageSectionsFallback';

export type PublicPageRendererProps = {
  content: unknown;
  project?: Record<string, unknown> | null;
  page?: Record<string, unknown> | null;
  projectSlug?: string | null;
  pageSlug?: string | null;
  projectConfig?: Record<string, unknown> | null;
  projectMenus?: { HEADER?: unknown[]; FOOTER?: unknown[] } | null;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>> | null;
};

/** Re-export — canonical implementation lives in `lib/site/publishedContentFormat.js`. */
export { normalizePublishedSections } from '@/lib/site/publishedContentFormat';

/**
 * Adapter wrapper for public page JSON.
 *
 * Priority:
 * 1. `PublicSitePageView` + `PublishedLiveTree` when slugs resolve a full published page
 * 2. `content.nodes` (builder schema) → `PublicPageLiveTreeView`
 * 3. `content.sections` → `PublicPageSectionsFallback`
 * 4. `content.blocks` / legacy arrays → `PublicPageBlocksFallback`
 */
export default async function PublicPageRenderer({
  content,
  project = null,
  page = null,
  projectSlug = null,
  pageSlug = null,
  projectConfig = null,
  projectMenus = null,
  searchParams = null,
}: PublicPageRendererProps) {
  const mode = resolvePublishedRenderMode(content);
  const slug = String(pageSlug || page?.slug || '');
  const projSlug = String(projectSlug || project?.slug || '');

  if (projSlug && slug) {
    const sp = searchParams ? await Promise.resolve(searchParams) : null;
    const pageParam = typeof sp?.page === 'string' ? Number(sp.page) : 0;
    const pageContext = Number.isInteger(pageParam) && pageParam > 0 ? { cms: { page: pageParam } } : null;
    const publishedPage = await getPublishedPageForPublic(projSlug, slug, pageContext);

    if (publishedPage?.snapshot_json?.length || mode === 'nodes') {
      return PublicSitePageView({
        projectSlug: projSlug,
        pageSlug: slug,
        searchParams,
      });
    }
  }

  if (mode === 'nodes') {
    const nodes = extractPublishedNodes(content);
    return (
      <PublicPageLiveTreeView
        nodes={nodes || []}
        project={project}
        page={page}
        projectConfig={projectConfig}
        projectMenus={projectMenus}
      />
    );
  }

  if (mode === 'sections') {
    return (
      <PublicPageSectionsFallback
        sections={normalizePublishedSections(content)}
        project={project}
        page={page}
        variant="sections"
      />
    );
  }

  if (mode === 'blocks') {
    return <PublicPageBlocksFallback content={content} project={project} page={page} />;
  }

  return (
    <PublicPageSectionsFallback sections={[]} project={project} page={page} variant="sections" />
  );
}
