/** Mobile nav / hamburger — shared by Menu runtime + inspector. */

export const MENU_HAMBURGER_ALIGNS = ['left', 'center', 'right'];

/** Tablet uses compact header too (logo | ☰). */
export const DEFAULT_MENU_MOBILE_BREAKPOINT_PX = 1024;

export function normalizeMenuHamburgerAlign(value, fallback = 'right') {
  const a = String(value || '')
    .toLowerCase()
    .trim();
  if (MENU_HAMBURGER_ALIGNS.includes(a)) return a;
  return fallback;
}

export function menuHamburgerAlignToJustify(align) {
  const a = normalizeMenuHamburgerAlign(align);
  if (a === 'left') return 'flex-start';
  if (a === 'center') return 'center';
  return 'flex-end';
}

export function resolveMenuMobileBreakpointPx(mobile = {}) {
  const n = Number(mobile?.breakpointPx ?? mobile?.breakpoint);
  if (Number.isFinite(n) && n >= 320 && n <= 1200) return Math.round(n);
  return DEFAULT_MENU_MOBILE_BREAKPOINT_PX;
}

export const MENU_DRAWER_ACTION_LAYOUTS = ['row', 'column'];

export const MENU_DRAWER_DENSITIES = ['compact', 'balanced', 'roomy'];

export function normalizeMenuDrawerActionsLayout(value, fallback = 'row') {
  const v = String(value || '')
    .toLowerCase()
    .trim();
  if (MENU_DRAWER_ACTION_LAYOUTS.includes(v)) return v;
  return fallback;
}

export function normalizeMenuDrawerDensity(value, fallback = 'compact') {
  const v = String(value || '')
    .toLowerCase()
    .trim();
  if (MENU_DRAWER_DENSITIES.includes(v)) return v;
  return fallback;
}

/** CSS variables for drawer panel (applied on `.menu-m` root). */
export function menuDrawerStyleVars(mobile = {}) {
  const density = normalizeMenuDrawerDensity(mobile?.drawerDensity, 'compact');
  if (density === 'roomy') {
    return {
      '--menu-m-top-pad': 'max(14px, env(safe-area-inset-top, 0px))',
      '--menu-m-link-pad': '14px 12px',
      '--menu-m-list-pad': '8px 14px 10px',
      '--menu-m-actions-pad': '12px 16px max(14px, env(safe-area-inset-bottom, 0px))',
      '--menu-m-actions-gap': '12px',
    };
  }
  if (density === 'balanced') {
    return {
      '--menu-m-top-pad': 'max(10px, env(safe-area-inset-top, 0px))',
      '--menu-m-link-pad': '12px 11px',
      '--menu-m-list-pad': '4px 12px 6px',
      '--menu-m-actions-pad': '10px 14px max(12px, env(safe-area-inset-bottom, 0px))',
      '--menu-m-actions-gap': '10px',
    };
  }
  return {
    '--menu-m-top-pad': 'max(8px, env(safe-area-inset-top, 0px))',
    '--menu-m-link-pad': '10px 10px',
    '--menu-m-list-pad': '2px 12px 4px',
    '--menu-m-actions-pad': '8px 14px max(10px, env(safe-area-inset-bottom, 0px))',
    '--menu-m-actions-gap': '10px',
  };
}
