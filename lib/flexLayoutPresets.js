import { themeSpacingPx } from '@/lib/siteDesignTheme';

/**
 * Flex presets for inspector — gaps use theme spacing tokens.
 * @param {object} siteTheme — normalized site theme
 */
export function buildFlexLayoutPresets(siteTheme) {
  return {
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: themeSpacingPx(siteTheme, 'lg'),
      gapScale: 'lg',
    },
    centerStack: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: themeSpacingPx(siteTheme, 'md'),
      gapScale: 'md',
    },
  };
}
