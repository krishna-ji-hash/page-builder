/** Per-logo hover zoom for ticker / marquee / logo carousels. */

export const DEFAULT_LOGO_HOVER_ZOOM_SCALE = 1.08;

export function resolveLogoHoverZoomScale(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_LOGO_HOVER_ZOOM_SCALE;
  return Math.min(1.5, Math.max(1, n));
}

export function resolveLogoHoverZoomEnabled(raw) {
  return raw === true;
}

/** @returns {{ className: string, style: Record<string, string> }} */
export function logoHoverZoomPresentation(enabled, scaleRaw, baseStyle = {}) {
  if (!resolveLogoHoverZoomEnabled(enabled)) {
    return { className: '', style: baseStyle || {} };
  }
  const scale = resolveLogoHoverZoomScale(scaleRaw);
  return {
    className: 'live-carousel--logo-hover-zoom',
    style: {
      ...(baseStyle || {}),
      '--carousel-logo-hover-scale': String(scale),
    },
  };
}
