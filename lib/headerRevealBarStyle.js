/** Main + reveal / reveal-on-scroll: solid bar chrome via meta.headerBehavior.revealBar + CSS vars. */

export const HEADER_REVEAL_BAR_STYLE_KEYS = new Set([
  'headerRevealBarMaxWidthPct',
  'headerRevealBarOffsetTopPx',
  'headerRevealBarBackgroundColor',
  'headerRevealBarBorderColor',
  'headerRevealBarBorderWidthPx',
  'headerRevealBarBorderRadiusPx',
  'headerRevealBarShadow',
]);

export function isHeaderRevealBarStyleKey(key) {
  return HEADER_REVEAL_BAR_STYLE_KEYS.has(key);
}

export function normalizeHeaderRevealBarStyle(raw) {
  const b = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  const maxWidthPctRaw = Number(b.maxWidthPct);
  const maxWidthPct =
    Number.isFinite(maxWidthPctRaw) && maxWidthPctRaw > 0
      ? Math.max(40, Math.min(100, Math.round(maxWidthPctRaw)))
      : 100;
  const shadowRaw = String(b.shadow || 'none').toLowerCase().trim();
  const shadow = shadowRaw === 'light' || shadowRaw === 'medium' ? shadowRaw : 'none';
  return {
    maxWidthPct,
    offsetTopPx: clampPx(Number(b.offsetTopPx), 0, 48),
    backgroundColor: String(b.backgroundColor || '').trim(),
    borderColor: String(b.borderColor || '').trim(),
    borderWidthPx: clampPx(Number(b.borderWidthPx), 0, 8),
    borderRadiusPx: clampPx(Number(b.borderRadiusPx), 0, 48),
    shadow,
  };
}

export function headerRevealBarFromBehavior(behavior) {
  return normalizeHeaderRevealBarStyle(behavior?.revealBar);
}

export function headerRevealBarInspectorFormFields(behavior, pickPending) {
  const bar = headerRevealBarFromBehavior(behavior);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    headerRevealBarMaxWidthPct: pick('headerRevealBarMaxWidthPct', bar.maxWidthPct),
    headerRevealBarOffsetTopPx: pick('headerRevealBarOffsetTopPx', bar.offsetTopPx),
    headerRevealBarBackgroundColor: pick('headerRevealBarBackgroundColor', bar.backgroundColor),
    headerRevealBarBorderColor: pick('headerRevealBarBorderColor', bar.borderColor),
    headerRevealBarBorderWidthPx: pick(
      'headerRevealBarBorderWidthPx',
      bar.borderWidthPx > 0 ? bar.borderWidthPx : 0
    ),
    headerRevealBarBorderRadiusPx: pick(
      'headerRevealBarBorderRadiusPx',
      bar.borderRadiusPx > 0 ? bar.borderRadiusPx : 0
    ),
    headerRevealBarShadow: pick('headerRevealBarShadow', bar.shadow),
  };
}

const SHADOW_VARS = {
  none: 'none',
  light: '0 8px 24px color-mix(in srgb, var(--color-text, var(--token-text-primary)) 8%, transparent)',
  medium: '0 14px 36px color-mix(in srgb, var(--color-text, var(--token-text-primary)) 14%, transparent)',
};

/** @param {ReturnType<typeof normalizeHeaderRevealBarStyle>} bar */
export function headerRevealBarToCssVars(bar) {
  const b = normalizeHeaderRevealBarStyle(bar);
  const vars = {};
  if (b.maxWidthPct > 0 && b.maxWidthPct < 100) {
    vars['--header-reveal-bar-width-pct'] = String(b.maxWidthPct);
  }
  if (b.offsetTopPx > 0) {
    vars['--header-reveal-bar-offset-top'] = `${b.offsetTopPx}px`;
  }
  if (b.backgroundColor) {
    vars['--header-reveal-bar-bg'] = b.backgroundColor;
  }
  if (b.borderColor && b.borderWidthPx > 0) {
    vars['--header-reveal-bar-border-color'] = b.borderColor;
  }
  if (b.borderWidthPx > 0) {
    vars['--header-reveal-bar-border-width'] = `${b.borderWidthPx}px`;
  }
  if (b.borderRadiusPx > 0) {
    vars['--header-reveal-bar-radius'] = `${b.borderRadiusPx}px`;
  }
  if (b.shadow !== 'none') {
    vars['--header-reveal-bar-shadow'] = SHADOW_VARS[b.shadow] || SHADOW_VARS.none;
  }
  return vars;
}

export function headerRevealBarDataAttrs(bar) {
  const b = normalizeHeaderRevealBarStyle(bar);
  const attrs = {};
  if (b.maxWidthPct > 0 && b.maxWidthPct < 100) {
    attrs['data-header-reveal-bar-contained'] = 'true';
  }
  return attrs;
}

export function patchHeaderRevealBarFromFormKey(key, value, prevBehavior) {
  const prev = headerRevealBarFromBehavior(prevBehavior);
  const next = { ...prev };

  if (key === 'headerRevealBarMaxWidthPct') {
    next.maxWidthPct = Math.max(40, Math.min(100, Math.round(Number(value) || 100)));
  } else if (key === 'headerRevealBarOffsetTopPx') {
    next.offsetTopPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'headerRevealBarBackgroundColor') {
    next.backgroundColor = String(value ?? '').trim();
  } else if (key === 'headerRevealBarBorderColor') {
    next.borderColor = String(value ?? '').trim();
  } else if (key === 'headerRevealBarBorderWidthPx') {
    next.borderWidthPx = Math.max(0, Math.min(8, Math.round(Number(value) || 0)));
  } else if (key === 'headerRevealBarBorderRadiusPx') {
    next.borderRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'headerRevealBarShadow') {
    const s = String(value || 'none').toLowerCase().trim();
    next.shadow = s === 'light' || s === 'medium' ? s : 'none';
  } else {
    return null;
  }

  return normalizeHeaderRevealBarStyle(next);
}

export function mergeHeaderBehaviorRevealBar(behavior, revealBar) {
  const hb = behavior && typeof behavior === 'object' ? behavior : {};
  return {
    ...hb,
    revealBar: normalizeHeaderRevealBarStyle(revealBar),
  };
}
