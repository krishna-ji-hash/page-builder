/** Menu presentation: shared by liveRenderer + BuilderCanvas. */

export const MENU_VARIANTS = ['inline', 'pill', 'underline', 'button'];

export const MENU_ALIGNS = ['left', 'center', 'right', 'space-between'];

export function normalizeMenuVariant(value) {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return MENU_VARIANTS.includes(v) ? v : 'pill';
}

export function normalizeMenuAlign(value) {
  const a = typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '-') : '';
  if (!a) return 'center';
  if (a === 'spacebetween') return 'space-between';
  return MENU_ALIGNS.includes(a) ? a : 'center';
}

/**
 * @param {{ orientation?: string, variant?: string, align?: string, extraClass?: string }} opts
 */
export function menuNavClassName(opts = {}) {
  const { orientation = 'row', variant, align, extraClass = '' } = opts;
  const v = normalizeMenuVariant(variant);
  const al = normalizeMenuAlign(align);
  const vert = orientation === 'column' ? 'menu--vertical' : '';
  const alignClass =
    al === 'left' ? 'menu--align-left' : al === 'space-between' ? 'menu--align-between' : `menu--align-${al}`;
  return ['menu', `menu--${v}`, alignClass, vert, extraClass].filter(Boolean).join(' ').trim();
}
