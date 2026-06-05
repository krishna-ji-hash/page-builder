/**
 * Read active feature-tab panel fields from builder DOM for a single atomic save.
 */

import { resolveFeatureTabsProps } from './featureTabsDefaults.js';
import { resolveActiveFeatureTabPanelIdFromDom } from './featureTabPanels.js';
import { ensureFontSizeMarkupInRoot } from './inlineFontSize.js';
import { featureTabFieldHasInlineHtml, sanitizeFeatureTabFieldHtml } from './featureTabInlineHtml.js';

/**
 * @param {ParentNode | null | undefined} shell
 * @param {Record<string, unknown> | null | undefined} tabsProps
 * @param {{ neutralizeHardcodedBodyTextColors?: boolean }} [sanitizeOpts]
 * @returns {{ tabId: string, patch: Record<string, unknown> } | null}
 */
export function buildFeatureTabPanelPatchFromDom(shell, tabsProps, sanitizeOpts = {}) {
  if (!shell || typeof shell.querySelector !== 'function') return null;
  const panelEl = shell.querySelector('.live-feature-tabs__panel.is-active');
  if (!panelEl) return null;
  const tabId = resolveActiveFeatureTabPanelIdFromDom(shell, tabsProps);
  const { tabs } = resolveFeatureTabsProps(tabsProps);
  if (!tabId || !tabs.some((t) => t.id === tabId)) return null;

  const patch = {};
  const headingEl = panelEl.querySelector('.live-feature-tabs__heading[data-bld-feature-tab-field]');
  const paraEl = panelEl.querySelector('.live-feature-tabs__paragraph[data-bld-feature-tab-field]');
  if (headingEl) {
    patch.heading = sanitizeFeatureTabFieldHtml(ensureFontSizeMarkupInRoot(headingEl), sanitizeOpts);
  }
  if (paraEl) {
    patch.paragraph = sanitizeFeatureTabFieldHtml(ensureFontSizeMarkupInRoot(paraEl), sanitizeOpts);
  }
  const bulletEls = panelEl.querySelectorAll('.live-feature-tabs__bullets [data-bld-feature-tab-field]');
  if (bulletEls.length) {
    patch.bullets = Array.from(bulletEls)
      .map((el) => {
        const raw = ensureFontSizeMarkupInRoot(el);
        if (featureTabFieldHasInlineHtml(raw)) {
          return sanitizeFeatureTabFieldHtml(raw, sanitizeOpts);
        }
        return String(el.innerText || '').trim();
      })
      .filter(Boolean);
  }
  if (!Object.keys(patch).length) return null;
  return { tabId, patch };
}
