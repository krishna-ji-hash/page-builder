/**
 * Maps style_json.interactions → CSS vars + presentation class (builder + live parity).
 */

import { animationKeyframeName, normalizeAnimationPreset } from './interactionAnimations.js';
import { parallaxInlineStyleVars, parallaxPresentationClass } from './interactionParallax.js';
import { parseFiniteNumber } from './inspectorNumeric.js';
import { resolveNodeInteractions } from './resolveNodeAnimation.js';

export const VALID_ANIMATION_TRIGGERS = new Set([
  'on-load',
  'on-scroll',
  'on-enter-viewport',
  'on-hover',
  'on-click',
  'on-focus',
]);

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
  if (raw === 'on-scroll') return 'on-enter-viewport';
  return VALID_ANIMATION_TRIGGERS.has(raw) ? raw : 'on-load';
}

/** CSS class suffix for scroll/viewport observers (shared implementation). */
export function scrollTriggerUsesInViewClass(trigger) {
  const t = resolveAnimationTrigger({ trigger });
  return t === 'on-enter-viewport' || t === 'on-scroll';
}

function animationIterationCount(anim = {}) {
  if (anim.loop === true) return 'infinite';
  const repeat = parseFiniteNumber(anim.repeat);
  if (repeat != null && repeat > 1) return String(Math.min(99, Math.floor(repeat)));
  return '1';
}

function styleForIx(style = {}, animationPresets) {
  if (!animationPresets) return style;
  const resolved = resolveNodeInteractions(style, animationPresets);
  return resolved ? { ...style, interactions: resolved } : style;
}

export function hasNodeInteractions(style = {}, animationPresets) {
  const s = styleForIx(style, animationPresets);
  const ix = s?.interactions;
  if (!ix || typeof ix !== 'object') return false;
  if (hasHoverStyles(ix.hover)) return true;
  if (ix.pressed && typeof ix.pressed === 'object' && Object.keys(ix.pressed).length) return true;
  if (ix.active && typeof ix.active === 'object' && Object.keys(ix.active).length) return true;
  if (ix.focus && typeof ix.focus === 'object' && Object.keys(ix.focus).length) return true;
  const animPreset = normalizeAnimationPreset(ix.animation?.preset);
  if (animPreset !== 'none') return true;
  return Boolean(parallaxPresentationClass(ix.parallax));
}

export function interactionPresentationClass(style = {}, animationPresets) {
  const s = styleForIx(style, animationPresets);
  if (!hasNodeInteractions(s, animationPresets)) return '';
  const ix = s?.interactions || {};
  const animPreset = normalizeAnimationPreset(ix.animation?.preset);
  const parts = ['live-node--ix'];
  if (animPreset && animPreset !== 'none') {
    parts.push(`live-node--ix-anim-${animPreset.replace(/[^a-z0-9_-]/gi, '')}`);
    const trigger = resolveAnimationTrigger(ix.animation);
    const triggerClass = scrollTriggerUsesInViewClass(trigger) ? 'on-scroll' : trigger;
    parts.push(`live-node--ix-trigger-${triggerClass.replace(/[^a-z0-9-]/gi, '')}`);
  }
  const parallaxClass = parallaxPresentationClass(ix.parallax);
  if (parallaxClass) parts.push(parallaxClass);
  return parts.join(' ');
}

export function interactionInlineStyleVars(style = {}, animationPresets) {
  const s = styleForIx(style, animationPresets);
  const ix = s?.interactions;
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

  const pressed = (ix.pressed && typeof ix.pressed === 'object' ? ix.pressed : null) || ix.active || {};
  if (pressed.scale != null && pressed.scale !== '') out['--node-active-scale'] = String(pressed.scale);
  if (pressed.background) {
    out['--node-active-bg'] = pressed.background;
    out['--btn-bg-press'] = pressed.background;
  }
  if (pressed.borderColor) {
    out['--node-active-border'] = pressed.borderColor;
    out['--btn-border-press'] = pressed.borderColor;
  }
  if (pressed.boxShadow) {
    out['--node-active-shadow'] = pressed.boxShadow;
    out['--btn-shadow-press'] = pressed.boxShadow;
  }
  if (pressed.textColor) {
    out['--node-active-text'] = pressed.textColor;
    out['--btn-text-press'] = pressed.textColor;
  }
  if (pressed.opacity != null && pressed.opacity !== '') out['--node-active-opacity'] = String(pressed.opacity);

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
  out['--node-anim-iteration'] = animationIterationCount(anim);

  Object.assign(out, parallaxInlineStyleVars(ix.parallax));

  return out;
}

export function hasInteractionCssVars(css = {}) {
  if (!css || typeof css !== 'object') return false;
  return Object.keys(css).some(
    (k) =>
      k.startsWith('--node-hover-') ||
      k.startsWith('--node-active-') ||
      k.startsWith('--node-anim-') ||
      k.startsWith('--node-parallax-') ||
      k.startsWith('--btn-bg-hover')
  );
}

export function pickInteractionVarsFromCss(css = {}) {
  const out = {};
  if (!css || typeof css !== 'object') return out;
  for (const [k, v] of Object.entries(css)) {
    if (
      k.startsWith('--node-hover-') ||
      k.startsWith('--node-active-') ||
      k.startsWith('--node-focus-') ||
      k.startsWith('--node-anim-') ||
      k.startsWith('--node-parallax-') ||
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

export function resolveLeafInteractionShell({ deviceStyle, previewCss, animationPresets } = {}) {
  const ixStyle = {
    ...interactionInlineStyleVars(deviceStyle || {}, animationPresets),
    ...pickInteractionVarsFromCss(previewCss || {}),
  };
  const hasVars = Object.keys(ixStyle).length > 0;
  let ixClass = interactionPresentationClass(deviceStyle || {}, animationPresets);
  if (hasVars && !ixClass.includes('live-node--ix')) {
    ixClass = ['live-node--ix', ixClass].filter(Boolean).join(' ');
  }
  return { ixStyle: hasVars ? ixStyle : null, ixClass };
}

export function mergeBuilderInlineCss(baseCss, previewCss) {
  if (!previewCss || typeof previewCss !== 'object') return baseCss || {};
  if (!baseCss || typeof baseCss !== 'object') return { ...previewCss };
  return { ...baseCss, ...previewCss };
}

/** Merge saved device style with inspector preview CSS so ix classes match live parity before save. */
export function deviceStyleForInteractionPreview(deviceStyle = {}, previewCss, animationPresets) {
  const base = styleForIx(deviceStyle, animationPresets) || deviceStyle;
  if (!previewCss || typeof previewCss !== 'object') return base;
  const hasAnimPreview = Boolean(previewCss['--node-anim-name'] || previewCss.animationName);
  const hasParallaxPreview = Boolean(previewCss['--node-parallax-speed']);
  if (!hasAnimPreview && !hasParallaxPreview) return base;

  const ix = { ...(base.interactions || {}) };
  if (hasAnimPreview && !ix.animation?.preset) {
    const name = String(previewCss['--node-anim-name'] || previewCss.animationName || '')
      .replace(/^bld-ix-/, '')
      .trim();
    if (name) {
      ix.animation = {
        preset: name,
        trigger: 'on-enter-viewport',
        ...(previewCss['--node-anim-duration']
          ? { duration: parseFloat(String(previewCss['--node-anim-duration'])) || 0.6 }
          : {}),
      };
    }
  }
  if (hasParallaxPreview && !ix.parallax?.enabled) {
    ix.parallax = {
      enabled: true,
      speed: parseFloat(String(previewCss['--node-parallax-speed'])) || 0.35,
      direction: 'vertical-up',
    };
  }
  return { ...base, interactions: ix };
}

export function animationCssFromInteractions(style = {}, animationPresets) {
  const s = styleForIx(style, animationPresets);
  const anim = s?.interactions?.animation;
  if (!anim?.preset || anim.preset === 'none') return {};
  if (resolveAnimationTrigger(anim) !== 'on-load') return {};

  const name = animationKeyframeName(anim.preset);
  if (!name) return {};
  const duration = anim.duration != null ? `${anim.duration}s` : '0.6s';
  const delay = anim.delay != null ? `${anim.delay}s` : '0s';
  const easing = anim.easing || 'ease';
  return {
    animationName: name,
    animationDuration: duration,
    animationDelay: delay,
    animationTimingFunction: easing,
    animationIterationCount: animationIterationCount(anim),
    animationFillMode: 'both',
  };
}
