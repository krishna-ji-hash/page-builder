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

/** Image nodes: full width on phones (override-only mobile layer). */
export const MOBILE_IMAGE_SIZE = {
  mobile: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { maxWidth: '100%', width: '100%' },
  },
};

/** Hero / split sections: copy first, visual second when row stacks. */
export const HERO_VISUAL_COLUMN_MOBILE = {
  mobile: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { flexBasis: 'auto', flexGrow: 0, order: 2, width: '100%', maxWidth: '100%' },
  },
};

export const HERO_CONTENT_COLUMN_MOBILE = {
  mobile: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { flexBasis: 'auto', flexGrow: 0, order: 1, width: '100%', maxWidth: '100%' },
  },
};

/** Site header row: stay horizontal on tablet/mobile (logo | ☰), not stacked like content sections. */
export function buildHeaderRowCompactLayout() {
  return {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  };
}

export const HEADER_ROW_MOBILE_COMPACT_FRAGMENT = {
  mobile: { layout: buildHeaderRowCompactLayout() },
  tablet: {
    layout: {
      ...buildHeaderRowCompactLayout(),
      gap: 12,
    },
  },
};

/** Footer columns: full width stack on phones (overrides persisted 50% desktop columns). */
export const FOOTER_COLUMN_MOBILE_PATCH = {
  mobile: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0, minWidth: 0 },
  },
  tablet: {
    size: { width: '100%', maxWidth: '100%' },
    layout: { flexBasis: 'auto', minWidth: 0 },
  },
};

/** Header columns: do not force `width: 100%` on small breakpoints (keeps logo | nav | actions in one row). */
export const HEADER_COLUMN_MOBILE_PATCH = {
  mobile: {
    size: { width: 'auto', maxWidth: '100%' },
    layout: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0 },
  },
  tablet: {
    size: { width: 'auto', maxWidth: '100%' },
    layout: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0 },
  },
};

/** Builder canvas / live preview: override persisted mobile column-stack on header rows. */
export function compactHeaderRowDeviceStyle(deviceStyle = {}) {
  const layout = { ...(deviceStyle.layout || {}) };
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      display: layout.display || 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: layout.alignItems || 'center',
      justifyContent: 'space-between',
      width: layout.width || '100%',
    },
  };
}

export function compactHeaderNavColumnDeviceStyle(deviceStyle = {}) {
  const layout = { ...(deviceStyle.layout || {}) };
  const size = { ...(deviceStyle.size || {}) };
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      display: layout.display || 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
      marginLeft: 'auto',
    },
    size: {
      ...size,
      width: 'auto',
      maxWidth: '100%',
    },
  };
}

export function compactHeaderLogoColumnDeviceStyle(deviceStyle = {}) {
  const layout = { ...(deviceStyle.layout || {}) };
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      display: layout.display || 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
    },
    size: {
      ...(deviceStyle.size || {}),
      width: 'auto',
      maxWidth: 'min(52vw, 220px)',
    },
  };
}

export function compactHeaderColumnDeviceStyle(deviceStyle = {}, { multiStack = false } = {}) {
  const layout = { ...(deviceStyle.layout || {}) };
  const size = { ...(deviceStyle.size || {}) };
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      ...(multiStack
        ? {
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'space-between',
            alignItems: 'center',
          }
        : {}),
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
    },
    size: {
      ...size,
      width: 'auto',
      maxWidth: size.maxWidth || '100%',
    },
  };
}

export function compactHeaderStackDeviceStyle(deviceStyle = {}, { flattened = false, hideActions = false } = {}) {
  const layout = { ...(deviceStyle.layout || {}) };
  if (hideActions) {
    return {
      ...deviceStyle,
      layout: { ...layout, display: 'none' },
    };
  }
  if (flattened) {
    return {
      ...deviceStyle,
      layout: {
        ...layout,
        display: layout.display || 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
    };
  }
  return {
    ...deviceStyle,
    layout: {
      ...layout,
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
      width: 'auto',
      maxWidth: '100%',
    },
  };
}
