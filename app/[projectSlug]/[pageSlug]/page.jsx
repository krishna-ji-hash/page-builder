import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { getPublishedPage } from '@/services/site/publishedPageService';
import { renderTree } from '@/lib/liveRenderer';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { isPublicSlug, resolveMaybeAsyncParams } from '@/lib/routeParams';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function cloneGlobalNode(node, prefix) {
  return {
    ...node,
    id: `${prefix}-${node.id}`,
    parentNodeId: null,
    children: Array.isArray(node.children)
      ? node.children.map((child) => ({
          ...cloneGlobalNode(child, prefix),
          parentNodeId: `${prefix}-${node.id}`,
        }))
      : [],
  };
}

export async function generateMetadata({ params }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    return {};
  }
  const page = await getPublishedPage(projectSlug, pageSlug);
  if (!page) return {};

  return {
    title: page.seo?.title || page.name,
    description: page.seo?.description || '',
    openGraph: {
      title: page.seo?.title || page.name,
      description: page.seo?.description || '',
    },
  };
}

export default async function PublicSitePage({ params, searchParams }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    return <div style={{ padding: 40 }}>Page not found</div>;
  }

  // Next.js 15: `searchParams` should be awaited before property access.
  const sp = searchParams ? await Promise.resolve(searchParams) : null;
  const pageParam = typeof sp?.page === 'string' ? Number(sp.page) : 0;
  const pageContext = Number.isInteger(pageParam) && pageParam > 0 ? { cms: { page: pageParam } } : null;
  const page = await getPublishedPage(projectSlug, pageSlug, pageContext);

  if (!page) {
    return <div style={{ padding: 40 }}>Page not found</div>;
  }

  if (!page.snapshot_json) {
    return <div style={{ padding: 40 }}>Page not published</div>;
  }

  if (!Array.isArray(page.snapshot_json) || page.snapshot_json.length === 0) {
    return <div style={{ padding: 40 }}>Published page is empty</div>;
  }

  const globalHeader = page.projectConfig?.globalSections?.header
    ? cloneGlobalNode(page.projectConfig.globalSections.header, 'global-header')
    : null;
  const globalFooter = page.projectConfig?.globalSections?.footer
    ? cloneGlobalNode(page.projectConfig.globalSections.footer, 'global-footer')
    : null;
  const renderNodes = buildRenderNodesWithGlobals(
    page.snapshot_json,
    globalHeader,
    globalFooter,
    cloneGlobalNode
  );
  const currentPath = `/${projectSlug}/${pageSlug}`;
  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const pageVars =
    siteTheme?.pageVars && typeof siteTheme.pageVars === 'object' && !Array.isArray(siteTheme.pageVars)
      ? siteTheme.pageVars?.[pageSlug] || null
      : null;
  const sectionGapPx = pageVars && Number.isFinite(Number(pageVars.sectionGapPx)) ? Number(pageVars.sectionGapPx) : null;
  const sectionPadBottomPx =
    pageVars && Number.isFinite(Number(pageVars.sectionPadBottomPx)) ? Number(pageVars.sectionPadBottomPx) : null;
  const stickyHeader = Boolean(pageVars?.stickyHeader);

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug={pageSlug}
      data-route-kind="published"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      style={{
        ...siteCssVars,
        ...(sectionGapPx != null ? { '--live-section-gap': `${sectionGapPx}px` } : {}),
        ...(sectionPadBottomPx != null ? { '--live-section-pad-bottom': `${sectionPadBottomPx}px` } : {}),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <div className="live-doc">
        <RuntimeProvider>
          {renderTree(renderNodes, {
            currentPath,
            projectPages: page.projectPages || [],
            siteTheme,
            pageId: page.id,
            projectId: page.projectId,
          })}
        </RuntimeProvider>
      </div>
    </div>
  );
}
