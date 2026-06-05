/**
 * Builder ↔ preview ↔ live must share one visual surface.
 * Use this module when adding widgets, templates, or layout CSS.
 */

/** CSS selector prefix for published live, draft preview, and builder live mirror. */
export const PARITY_SURFACE_SELECTOR = ':is(.live-doc, .bld-canvas__live-mirror)';

/**
 * Widgets that own critical layout via inline styles (immune to global .live-doc img resets).
 * Register new entries when adding size/fit-sensitive UI.
 */
export const PARITY_INLINE_STYLE_CONTRACTS = Object.freeze({
  featureTabPanelImage: {
    module: 'lib/featureTabPanelImage.js',
    markerAttr: 'data-ft-panel-image',
    appliesTo: 'Feature tabs panel image (all tabs)',
  },
});

/**
 * Layout CSS properties that must not differ between builder-only and live surfaces.
 */
export const PARITY_RISKY_LAYOUT_PROPS = Object.freeze([
  'overflow',
  'overflow-x',
  'overflow-y',
  'object-fit',
  'object-position',
  'height',
  'max-height',
  'min-height',
]);

/**
 * Builder-only selectors allowed to change interaction chrome, not published layout.
 */
export const PARITY_BUILDER_CHROME_ALLOW = Object.freeze([
  '.bld-node__chrome',
  '.bld-node-controls',
  '.bld-transform-handle',
  '.bld-canvas-toolbar',
  '.bld-row-placeholder',
  'pointer-events',
  '.live-feature-tabs__builder-hint',
  '.live-feature-tabs__editable:focus',
  '.live-feature-tabs__image-btn',
]);
