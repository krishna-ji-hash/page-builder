/**
 * Responsive defaults for style_json (templates + normalization).
 * Gaps use site theme spacing tokens via {@link themeSpacingPx}.
 */

import { DEFAULT_SITE_THEME, themeSpacingPx } from './siteDesignTheme.js';

/** Root row on small viewports: stack columns; gap uses theme `lg` slot. */
export function buildRowMobileStackLayout(siteTheme = DEFAULT_SITE_THEME) {
  return {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: themeSpacingPx(siteTheme, 'lg'),
  };
}

/** Column mobile width only (flexBasis left to user / desktop). */
export const COLUMN_MOBILE_WIDTH_ONLY = {
  mobile: {
    size: { width: '100%' },
  },
};

/** Full template patch: width + flexBasis for new sections from library. */
export const COLUMN_MOBILE_PATCH = {
  mobile: {
    size: { width: '100%' },
    layout: { flexBasis: 'auto' },
  },
};

export const ROW_MOBILE_STACK_FRAGMENT = {
  mobile: {
    layout: buildRowMobileStackLayout(DEFAULT_SITE_THEME),
  },
};
