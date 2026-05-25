import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { renderTree } from '@/lib/liveRenderer';
import { getPageVarsBucket, livePageCssVarOverrides, resolveBodyLayout, resolveContentMaxWidthPx } from '@/lib/livePageCssVars';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import * as cmsService from '@/services/builder/cmsService';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import LiveDoc from '@/components/live/LiveDoc';
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
  let renderBase = state.tree;
  // Expand linked global components before renderTree (render pipeline unchanged).
  const ids = [];
  const walk = (nodes) => {
    for (const n of nodes || []) {
      const meta = n?.props?.meta || n?.meta || null;
      if (meta?.globalMode === 'linked' && meta?.globalComponentId) ids.push(Number(meta.globalComponentId));
      if (Array.isArray(n?.children) && n.children.length) walk(n.children);
    }
  };
  walk(renderBase);
  const uniq = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (uniq.length) {
    const comps = await getGlobalComponentsByIds(state.page.projectId, uniq);
    const map = new Map(comps.map((c) => [c.id, c.snapshot]));
    renderBase = expandLinkedGlobalComponents(renderBase, (id) => map.get(id) || null);
  }

  // Expand CMS repeaters/bindings before renderTree (render pipeline unchanged).
  renderBase = await expandCms(renderBase, { projectId: state.page.projectId, cmsService });

  const renderNodes = buildRenderNodesWithGlobals(renderBase, globalHeader, globalFooter, cloneGlobalNode);
  const currentPath = `/${state.page.projectSlug}/${state.page.slug}`;
  const projectPages = (state.projectPages || []).map((page) => ({
    slug: page.slug,
    title: page.title,
    href: `/${state.page.projectSlug}/${page.slug}`,
  }));
  const siteTheme = normalizeSiteTheme(state.page?.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const pageSlug = state.page.slug;
  const pageVars = getPageVarsBucket(siteTheme, pageSlug);
  const sectionGapPx = pageVars && Number.isFinite(Number(pageVars.sectionGapPx)) ? Number(pageVars.sectionGapPx) : null;
  const sectionPadBottomPx =
    pageVars && Number.isFinite(Number(pageVars.sectionPadBottomPx)) ? Number(pageVars.sectionPadBottomPx) : null;
  const contentMaxWidthPx = resolveContentMaxWidthPx(pageVars);
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, pageSlug);

  return (
    <div
      className="live-site"
      data-project-slug={state.page.projectSlug}
      data-page-slug={state.page.slug}
      data-route-kind="draft-preview"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      data-live-body-layout={bodyLayout}
      style={{
        ...siteCssVars,
        ...livePageCssVarOverrides({ sectionGapPx, sectionPadBottomPx, contentMaxWidthPx }),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <LiveDoc>
        <RuntimeProvider>
          {renderTree(renderNodes, {
            currentPath,
            projectPages,
            siteTheme,
            pageSlug,
            pageId: state.page.id,
            projectId: state.page.projectId,
            projectSlug: state.page.projectSlug,
          })}
        </RuntimeProvider>
      </LiveDoc>
    </div>
  );
}

