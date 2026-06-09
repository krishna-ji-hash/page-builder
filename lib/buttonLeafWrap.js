/** Shrink-wrap shell for buttons inside flex stacks (builder shell vs live parity). */

export const BUTTON_LEAF_WRAP_CLASS = 'live-leaf-wrap live-leaf-wrap--button';

/**
 * @param {Record<string, unknown>} [css] — merged inline css from styleToCss
 */
export function liveLeafWrapStyleForButton(css = {}) {
  const ta = String(css.textAlign || 'left').trim().toLowerCase();
  const alignSelf = ta === 'center' ? 'center' : ta === 'right' ? 'flex-end' : 'flex-start';
  const widthRaw = css.width != null ? String(css.width).trim().toLowerCase() : '';
  const hasExplicitWidth =
    widthRaw &&
    widthRaw !== 'auto' &&
    widthRaw !== 'fit-content' &&
    widthRaw !== 'max-content' &&
    widthRaw !== 'min-content';

  const base = { minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', alignSelf };

  if (hasExplicitWidth) {
    return { ...base, width: css.width, maxWidth: css.maxWidth || '100%' };
  }

  return { ...base, display: 'inline-flex', width: 'fit-content' };
}
