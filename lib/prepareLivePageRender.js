/**
 * Draft preview + published live: same header repair and theme alignment as the builder canvas.
 */
import { repairHeaderRowsInTree } from './headerCompactLayout.js';
import { normalizeSiteTheme } from './siteDesignTheme.js';
import {
  alignThemeTokensWithSiteTheme,
  normalizeThemeTokens,
} from './themeTokens.js';

/**
 * @param {object|null|undefined} projectConfig
 * @returns {{ siteTheme: object, themeTokens: object }}
 */
export function resolveLiveProjectTheme(projectConfig = {}) {
  const siteTheme = normalizeSiteTheme(projectConfig?.siteTheme);
  const themeTokens = alignThemeTokensWithSiteTheme(
    siteTheme,
    normalizeThemeTokens(projectConfig?.themeTokens)
  );
  return { siteTheme, themeTokens };
}

/**
 * Repair header rows in the page tree (matches `BuilderShell` load pipeline).
 *
 * @param {object[]} nodes
 * @param {object|null|undefined} projectConfig
 * @returns {{ nodes: object[], siteTheme: object, themeTokens: object }}
 */
export function prepareNodesForLiveRender(nodes, projectConfig = {}) {
  const { siteTheme, themeTokens } = resolveLiveProjectTheme(projectConfig);
  const list = Array.isArray(nodes) ? nodes : [];
  return {
    nodes: repairHeaderRowsInTree(list, siteTheme),
    siteTheme,
    themeTokens,
  };
}

/**
 * Options for `PublishedLiveTree` / `renderTree` on draft and published routes.
 *
 * @param {object|null|undefined} projectConfig
 * @param {object} [extra]
 */
export function buildPublishedLiveRenderOptions(projectConfig = {}, extra = {}) {
  const { siteTheme, themeTokens } = resolveLiveProjectTheme(projectConfig);
  return {
    siteTheme,
    themeTokens,
    animationPresets: projectConfig?.animationPresets,
    stylePresets: projectConfig?.stylePresets,
    publicSite: true,
    ...extra,
  };
}
