import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { renderTree } from '@/lib/liveRenderer';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getBuilderState } from '@/services/builder/builderService';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export default async function DraftPreviewPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return <div style={{ padding: 40 }}>Invalid preview page id.</div>;
  }

  const state = await getBuilderState(pageId);
  if (!state?.page) {
    return <div style={{ padding: 40 }}>Page not found.</div>;
  }
  if (!Array.isArray(state.tree) || !state.tree.length) {
    return <div style={{ padding: 40 }}>Draft is empty.</div>;
  }

  const globalHeader = state.page.projectConfig?.globalSections?.header
    ? cloneGlobalNode(state.page.projectConfig.globalSections.header, 'global-header')
    : null;
  const globalFooter = state.page.projectConfig?.globalSections?.footer
    ? cloneGlobalNode(state.page.projectConfig.globalSections.footer, 'global-footer')
    : null;
  const renderNodes = buildRenderNodesWithGlobals(state.tree, globalHeader, globalFooter, cloneGlobalNode);
  const currentPath = `/${state.page.projectSlug}/${state.page.slug}`;
  const projectPages = (state.projectPages || []).map((page) => ({
    slug: page.slug,
    title: page.title,
    href: `/${state.page.projectSlug}/${page.slug}`,
  }));
  const siteTheme = normalizeSiteTheme(state.page?.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const pageSlug = state.page.slug;
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
      data-project-slug={state.page.projectSlug}
      data-page-slug={state.page.slug}
      data-route-kind="draft-preview"
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
            projectPages,
            siteTheme,
            pageId: state.page.id,
            projectId: state.page.projectId,
          })}
        </RuntimeProvider>
      </div>
    </div>
  );
}

