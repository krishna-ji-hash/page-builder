import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { getPageVarsBucket, livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import {
  buildPublishedLiveRenderOptions,
  prepareNodesForLiveRender,
} from '@/lib/prepareLivePageRender';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import * as cmsService from '@/services/builder/cmsService';
import LiveDoc from '@/components/live/LiveDoc';
import LcpImagePreload from '@/components/seo/LcpImagePreload';
import { getDraftPageForBuilder } from '@/services/builder/builderService';
import { publicPagePath } from '@/lib/publicSiteUrls';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';

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

export default async function DraftPreviewView({ pageId }) {
  const pid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) {
    return <div style={{ padding: 40 }}>Invalid preview URL.</div>;
  }

  const state = await getDraftPageForBuilder(pid);
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

  renderBase = await expandCms(renderBase, { projectId: state.page.projectId, cmsService });

  const mergedNodes = buildRenderNodesWithGlobals(renderBase, globalHeader, globalFooter, cloneGlobalNode);
  const { nodes: renderNodes, siteTheme, themeTokens } = prepareNodesForLiveRender(
    mergedNodes,
    state.page?.projectConfig
  );
  const currentPath = publicPagePath(state.page.projectSlug, state.page.slug);
  const projectPages = (state.projectPages || []).map((page) => ({
    slug: page.slug,
    title: page.title,
    href: publicPagePath(state.page.projectSlug, page.slug),
  }));
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);
  const pageSlug = state.page.slug;
  const pageVars = getPageVarsBucket(siteTheme, pageSlug);
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, pageSlug);

  return (
    <div
      className="live-site"
      data-site-preset={siteTheme.presetId || 'light'}
      data-token-mode={themeTokens.mode === 'dark' ? 'dark' : 'light'}
      data-project-slug={state.page.projectSlug}
      data-page-slug={state.page.slug}
      data-route-kind="draft-preview"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      data-live-body-layout={bodyLayout}
      style={{
        ...siteCssVars,
        ...tokenVars,
        ...livePageCssVarOverridesForPage(siteTheme, pageSlug),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <LcpImagePreload nodes={renderNodes} />
      <LiveDoc device="desktop">
        <PublishedLiveTree
          nodes={renderNodes}
          options={buildPublishedLiveRenderOptions(state.page?.projectConfig, {
            device: 'desktop',
            currentPath,
            projectPages,
            pageSlug,
            pageId: state.page.id,
            projectId: state.page.projectId,
            projectSlug: state.page.projectSlug,
            builderTree: renderNodes,
          })}
        />
      </LiveDoc>
    </div>
  );
}
