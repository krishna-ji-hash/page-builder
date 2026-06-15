import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { getPageVarsBucket, livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import {
  buildPublishedLiveRenderOptions,
  prepareNodesForLiveRender,
} from '@/lib/prepareLivePageRender';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { applyHomeHeaderNavToGlobal, syncPageTreeHeaderNavFromHome } from '@/lib/globalHeaderNavSync';
import { getPublishedHomeHeaderRow } from '@/services/site/homeHeaderNavService';
import LiveDoc from '@/components/live/LiveDoc';
import LcpImagePreload from '@/components/seo/LcpImagePreload';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { getVersionPreviewPageState } from '@/services/site/versionPreviewService';
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

export default async function VersionPreviewView({ versionId, pageContext = null }) {
  const vid = Number(versionId);
  if (!Number.isInteger(vid) || vid <= 0) {
    return <div style={{ padding: 40 }}>Invalid version preview URL.</div>;
  }

  const state = await getVersionPreviewPageState(vid, pageContext);
  if (!state?.page) {
    return <div style={{ padding: 40 }}>Version not found.</div>;
  }
  if (!Array.isArray(state.snapshot_json) || !state.snapshot_json.length) {
    return <div style={{ padding: 40 }}>Version snapshot is empty.</div>;
  }

  const pageSlug = state.page.slug;
  const projectSlug = state.page.projectSlug;

  const homeHeader = await getPublishedHomeHeaderRow(projectSlug);
  const pageNodes = syncPageTreeHeaderNavFromHome(state.snapshot_json, homeHeader, pageSlug);
  const frozenGlobals = state.publishedGlobalSections || {};
  const syncedHeaderSource =
    frozenGlobals.header && homeHeader
      ? applyHomeHeaderNavToGlobal(frozenGlobals.header, homeHeader)
      : frozenGlobals.header;
  const globalHeader = syncedHeaderSource
    ? cloneGlobalNode(syncedHeaderSource, 'global-header')
    : null;
  const globalFooter = frozenGlobals.footer
    ? cloneGlobalNode(frozenGlobals.footer, 'global-footer')
    : null;

  const mergedNodes = buildRenderNodesWithGlobals(
    pageNodes,
    globalHeader,
    globalFooter,
    cloneGlobalNode
  );
  const { nodes: renderNodes, siteTheme, themeTokens } = prepareNodesForLiveRender(
    mergedNodes,
    state.page.projectConfig
  );

  const currentPath = publicPagePath(projectSlug, pageSlug);
  const projectPages = (state.projectPages || []).map((page) => ({
    slug: page.slug,
    title: page.title,
    href: publicPagePath(projectSlug, page.slug),
  }));
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);
  const pageVars = getPageVarsBucket(siteTheme, pageSlug);
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, pageSlug);

  return (
    <div
      className="live-site"
      data-site-preset={siteTheme.presetId || 'light'}
      data-token-mode={themeTokens.mode === 'dark' ? 'dark' : 'light'}
      data-project-slug={projectSlug}
      data-page-slug={pageSlug}
      data-route-kind="version-preview"
      data-version-id={String(vid)}
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
          options={buildPublishedLiveRenderOptions(state.page.projectConfig, {
            device: 'desktop',
            currentPath,
            projectPages,
            pageSlug,
            pageId: state.page.id,
            projectId: state.page.projectId,
            projectSlug,
            builderTree: renderNodes,
          })}
        />
      </LiveDoc>
    </div>
  );
}
