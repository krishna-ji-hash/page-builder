/**
 * Maps style_json.interactions → CSS vars + presentation class (builder + live parity).
 */

import { animationKeyframeName, normalizeAnimationPreset } from './interactionAnimations.js';
import { parseFiniteNumber } from './inspectorNumeric.js';

const VALID_TRIGGERS = new Set(['on-load', 'on-hover', 'on-scroll']);

function hasHoverStyles(hover = {}) {
  return Boolean(
    hover.background ||
      hover.textColor ||
      hover.borderColor ||
      hover.boxShadow ||
      hover.scale != null ||
      hover.translateY != null ||
      hover.opacity != null
  );
}

export function resolveAnimationTrigger(anim = {}) {
  const raw = String(anim?.trigger || 'on-load').trim() || 'on-load';
  return VALID_TRIGGERS.has(raw) ? raw : 'on-load';
}

export function hasNodeInteractions(style = {}) {
  const ix = style?.interactions;
  if (!ix || typeof ix !== 'object') return false;
  if (hasHoverStyles(ix.hover)) return true;
  if (ix.active && typeof ix.active === 'object' && Object.keys(ix.active).length) return true;
  if (ix.focus && typeof ix.focus === 'object' && Object.keys(ix.focus).length) return true;
  const animPreset = normalizeAnimationPreset(ix.animation?.preset);
  return animPreset !== 'none';
}

export function interactionPresentationClass(style = {}) {
  if (!hasNodeInteractions(style)) return '';
  const ix = style?.interactions || {};
  const animPreset = normalizeAnimationPreset(ix.animation?.preset);
  const parts = ['live-node--ix'];
  if (animPreset && animPreset !== 'none') {
    parts.push(`live-node--ix-anim-${animPreset.replace(/[^a-z0-9_-]/gi, '')}`);
    parts.push(`live-node--ix-trigger-${resolveAnimationTrigger(ix.animation).replace(/[^a-z0-9-]/gi, '')}`);
  }
  return parts.join(' ');
}

export function interactionInlineStyleVars(style = {}) {
  const ix = style?.interactions;
  if (!ix || typeof ix !== 'object') return {};

  const out = {};
  const hover = ix.hover || {};
  if (hover.background) {
    out['--node-hover-bg'] = hover.background;
    out['--btn-bg-hover'] = hover.background;
  }
  if (hover.textColor) {
    out['--node-hover-text'] = hover.textColor;
    out['--btn-text-hover'] = hover.textColor;
  }
  if (hover.borderColor) {
    out['--node-hover-border'] = hover.borderColor;
    out['--btn-border-hover'] = hover.borderColor;
  }
  if (hover.boxShadow) {
    out['--node-hover-shadow'] = hover.boxShadow;
    out['--btn-shadow-hover'] = hover.boxShadow;
  }
  if (hover.scale != null && hover.scale !== '') out['--node-hover-scale'] = String(hover.scale);
  if (hover.translateY != null && hover.translateY !== '') out['--node-hover-translate-y'] = String(hover.translateY);
  if (hover.opacity != null && hover.opacity !== '') out['--node-hover-opacity'] = String(hover.opacity);

  const active = ix.active || {};
  if (active.scale != null && active.scale !== '') out['--node-active-scale'] = String(active.scale);
  if (active.background) {
    out['--node-active-bg'] = active.background;
    out['--btn-bg-press'] = active.background;
  }
  if (active.borderColor) {
    out['--node-active-border'] = active.borderColor;
    out['--btn-border-press'] = active.borderColor;
  }
  if (active.boxShadow) {
    out['--node-active-shadow'] = active.boxShadow;
    out['--btn-shadow-press'] = active.boxShadow;
  }
  if (active.textColor) {
    out['--node-active-text'] = active.textColor;
    out['--btn-text-press'] = active.textColor;
  }
  if (active.opacity != null && active.opacity !== '') out['--node-active-opacity'] = String(active.opacity);

  const focus = ix.focus || {};
  if (focus.outline) out['--node-focus-outline'] = focus.outline;
  if (focus.ringColor) out['--node-focus-ring'] = focus.ringColor;

  const anim = ix.animation || {};
  const animPreset = normalizeAnimationPreset(anim.preset);
  if (animPreset !== 'none') {
    const name = animationKeyframeName(animPreset);
    if (name) out['--node-anim-name'] = name;
  }
  const animDuration = parseFiniteNumber(anim.duration);
  if (animDuration != null && animDuration >= 0) out['--node-anim-duration'] = `${animDuration}s`;
  const animDelay = parseFiniteNumber(anim.delay);
  if (animDelay != null && animDelay >= 0) out['--node-anim-delay'] = `${animDelay}s`;
  if (anim.easing) out['--node-anim-easing'] = anim.easing;
  out['--node-anim-iteration'] = anim.loop ? 'infinite' : '1';

  return out;
}

/** Inline animation only for on-load; hover/scroll use CSS classes in live-site.css */
export function hasInteractionCssVars(css = {}) {
  if (!css || typeof css !== 'object') return false;
  return Object.keys(css).some(
    (k) =>
      k.startsWith('--node-hover-') ||
      k.startsWith('--node-active-') ||
      k.startsWith('--node-anim-') ||
      k.startsWith('--btn-bg-hover')
  );
}

/** Extract interaction CSS variables from a styleToCss / preview object. */
export function pickInteractionVarsFromCss(css = {}) {
  const out = {};
  if (!css || typeof css !== 'object') return out;
  for (const [k, v] of Object.entries(css)) {
    if (
      k.startsWith('--node-hover-') ||
      k.startsWith('--node-active-') ||
      k.startsWith('--node-focus-') ||
      k.startsWith('--node-anim-') ||
      k.startsWith('--btn-bg-hover') ||
      k.startsWith('--btn-text-hover') ||
      k.startsWith('--btn-border-hover') ||
      k.startsWith('--btn-shadow-hover') ||
      k.startsWith('--btn-bg-press') ||
      k.startsWith('--btn-text-press') ||
      k.startsWith('--btn-border-press') ||
      k.startsWith('--btn-shadow-press')
    ) {
      out[k] = v;
    }
  }
  return out;
}

/** Builder leaf shell: merge saved + preview ix vars and ensure `live-node--ix` class. */
export function resolveLeafInteractionShell({ deviceStyle, previewCss } = {}) {
  const ixStyle = {
    ...interactionInlineStyleVars(deviceStyle || {}),
    ...pickInteractionVarsFromCss(previewCss || {}),
  };
  const hasVars = Object.keys(ixStyle).length > 0;
  let ixClass = interactionPresentationClass(deviceStyle || {});
  if (hasVars && !ixClass.includes('live-node--ix')) {
    ixClass = ['live-node--ix', ixClass].filter(Boolean).join(' ');
  }
  return { ixStyle: hasVars ? ixStyle : null, ixClass };
}

/** Merge inspector canvas preview CSS onto liveRenderer output. */
export function mergeBuilderInlineCss(baseCss, previewCss) {
  if (!previewCss || typeof previewCss !== 'object') return baseCss || {};
  if (!baseCss || typeof baseCss !== 'object') return { ...previewCss };
  return { ...baseCss, ...previewCss };
}

export function animationCssFromInteractions(style = {}) {
  const anim = style?.interactions?.animation;
  if (!anim?.preset || anim.preset === 'none') return {};
  if (resolveAnimationTrigger(anim) !== 'on-load') return {};

  const name = animationKeyframeName(anim.preset);
  if (!name) return {};
  const duration = anim.duration != null ? `${anim.duration}s` : '0.6s';
  const delay = anim.delay != null ? `${anim.delay}s` : '0s';
  const easing = anim.easing || 'ease';
  const iteration = anim.loop ? 'infinite' : '1';
  return {
    animationName: name,
    animationDuration: duration,
    animationDelay: delay,
    animationTimingFunction: easing,
    animationIterationCount: iteration,
    animationFillMode: 'both',
  };
}
