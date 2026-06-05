/**
 * Feature tabs panel image — one style contract for builder, preview, and live.
 * Inline styles beat `.live-doc img` global resets in live-site.css.
 */

/**
 * @param {unknown} imageFit
 * @param {unknown} panelHeightPx
 * @returns {import('react').CSSProperties}
 */
export function featureTabPanelImageInlineStyle(imageFit, panelHeightPx) {
  const h = Math.max(120, Math.min(800, Math.floor(Number(panelHeightPx) || 360)));
  const fitRaw = String(imageFit || 'contain').trim().toLowerCase();
  const fit = fitRaw === 'fill' ? 'fill' : 'contain';
  const crop = fit === 'fill';
  return {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    objectFit: crop ? 'fill' : 'contain',
    objectPosition: 'center',
    boxSizing: 'border-box',
    ...(crop
      ? {
          height: `${h}px`,
          minHeight: `${Math.min(220, h)}px`,
          maxHeight: `${h}px`,
        }
      : {
          height: 'auto',
          maxHeight: 'none',
          minHeight: 0,
        }),
  };
}

/**
 * CSS variables for the figure shell (radius clip box).
 * @param {unknown} imageFit
 * @param {unknown} panelHeightPx
 */
export function featureTabPanelFigureVars(imageFit, panelHeightPx) {
  const h = Math.max(120, Math.min(800, Math.floor(Number(panelHeightPx) || 360)));
  const fitRaw = String(imageFit || 'contain').trim().toLowerCase();
  const fit = fitRaw === 'fill' ? 'fill' : 'contain';
  return {
    '--ft-panel-image-height': `${h}px`,
    '--ft-panel-image-min-height': `${Math.min(220, h)}px`,
    '--ft-panel-image-fit': fit,
  };
}
