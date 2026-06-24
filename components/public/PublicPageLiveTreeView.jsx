import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import LiveDoc from '@/components/live/LiveDoc';
import { getPageVarsBucket, livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import {
  buildPublishedLiveRenderOptions,
  prepareNodesForLiveRender,
} from '@/lib/prepareLivePageRender';
import { injectProjectMenusIntoNodes } from '@/lib/site/injectProjectMenus.js';
import { publicPagePath } from '@/lib/publicSiteUrls';

function resolveProjectConfig(project, projectConfig) {
  if (projectConfig && typeof projectConfig === 'object') return projectConfig;
  if (project?.configJson && typeof project.configJson === 'object') return project.configJson;
  if (project?.projectConfig && typeof project.projectConfig === 'object') return project.projectConfig;
  return {};
}

/**
 * Primary node-tree public renderer (PublishedLiveTree + live-site CSS).
 * Used by PublicPageRenderer adapter when content has `nodes`.
 */
export default function PublicPageLiveTreeView({
  nodes,
  project = null,
  page = null,
  projectConfig = null,
  projectPages = null,
  projectMenus = null,
}) {
  const config = resolveProjectConfig(project, projectConfig);
  const projectSlug = String(project?.slug || '');
  const pageSlug = String(page?.slug || 'home');
  const sourceNodes = injectProjectMenusIntoNodes(
    Array.isArray(nodes) ? nodes : [],
    projectMenus
  );

  const { nodes: renderNodes, siteTheme, themeTokens } = prepareNodesForLiveRender(sourceNodes, config);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);
  const pageVars = getPageVarsBucket(siteTheme, pageSlug);
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, pageSlug);
  const currentPath = projectSlug ? publicPagePath(projectSlug, pageSlug) : `/${pageSlug}`;

  const pages =
    Array.isArray(projectPages) && projectPages.length
      ? projectPages
      : pageSlug
        ? [{ slug: pageSlug, title: page?.title || pageSlug, href: currentPath }]
        : [];

  return (
    <div
      className="live-site"
      data-site-preset={siteTheme.presetId || 'light'}
      data-token-mode={themeTokens.mode === 'dark' ? 'dark' : 'light'}
      data-project-slug={projectSlug || undefined}
      data-page-slug={pageSlug}
      data-route-kind="published"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      data-live-body-layout={bodyLayout}
      style={{
        ...siteCssVars,
        ...tokenVars,
        ...livePageCssVarOverridesForPage(siteTheme, pageSlug),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <LiveDoc>
        <PublishedLiveTree
          nodes={renderNodes}
          options={buildPublishedLiveRenderOptions(config, {
            currentPath,
            projectPages: pages,
            pageSlug,
            pageId: page?.id,
            projectId: page?.projectId ?? project?.id,
            projectSlug,
            builderTree: renderNodes,
          })}
        />
      </LiveDoc>
    </div>
  );
}
