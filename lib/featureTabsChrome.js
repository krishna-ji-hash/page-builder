/** Feature tabs chrome (tab bar + panel) — props.chrome + CSS variables. */

export function normalizeFeatureTabsChrome(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const clampPx = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : 0);
  const pct = Number(c.blockMaxWidthPct);
  return {
    barBackgroundColor: String(c.barBackgroundColor || '').trim(),
    activeTabColor: String(c.activeTabColor || '').trim(),
    activeTabUnderlineColor: String(c.activeTabUnderlineColor || '').trim(),
    panelBackgroundColor: String(c.panelBackgroundColor || '').trim(),
    panelBorderColor: String(c.panelBorderColor || '').trim(),
    panelBorderWidthPx: clampPx(Number(c.panelBorderWidthPx), 0, 8),
    panelBorderRadiusPx: clampPx(Number(c.panelBorderRadiusPx), 0, 48),
    blockMaxWidthPct:
      Number.isFinite(pct) && pct > 0 ? Math.max(50, Math.min(100, Math.round(pct))) : 100,
  };
}

export function featureTabsChromeFromProps(props) {
  return normalizeFeatureTabsChrome(props?.chrome);
}

export function featureTabsChromeToCssVars(chrome) {
  const c = normalizeFeatureTabsChrome(chrome);
  const vars = {};
  if (c.barBackgroundColor) vars['--ft-bar-bg'] = c.barBackgroundColor;
  if (c.activeTabColor) vars['--ft-tab-active-color'] = c.activeTabColor;
  if (c.activeTabUnderlineColor) vars['--ft-tab-active-underline'] = c.activeTabUnderlineColor;
  if (c.panelBackgroundColor) vars['--ft-panel-bg'] = c.panelBackgroundColor;
  if (c.panelBorderColor && c.panelBorderWidthPx > 0) {
    vars['--ft-panel-border-color'] = c.panelBorderColor;
    vars['--ft-panel-border-width'] = `${c.panelBorderWidthPx}px`;
  }
  if (c.panelBorderRadiusPx > 0) vars['--ft-panel-radius'] = `${c.panelBorderRadiusPx}px`;
  if (c.blockMaxWidthPct > 0 && c.blockMaxWidthPct < 100) {
    vars['--ft-block-max-width-pct'] = String(c.blockMaxWidthPct);
  }
  return vars;
}

export function featureTabsChromeInspectorFields(props, pickPending) {
  const c = featureTabsChromeFromProps(props);
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    featureTabsBarBg: pick('featureTabsBarBg', c.barBackgroundColor),
    featureTabsActiveTabColor: pick('featureTabsActiveTabColor', c.activeTabColor),
    featureTabsActiveTabUnderline: pick('featureTabsActiveTabUnderline', c.activeTabUnderlineColor),
    featureTabsPanelBg: pick('featureTabsPanelBg', c.panelBackgroundColor),
    featureTabsPanelBorderColor: pick('featureTabsPanelBorderColor', c.panelBorderColor),
    featureTabsPanelBorderWidthPx: pick(
      'featureTabsPanelBorderWidthPx',
      c.panelBorderWidthPx > 0 ? c.panelBorderWidthPx : 0
    ),
    featureTabsPanelRadiusPx: pick(
      'featureTabsPanelRadiusPx',
      c.panelBorderRadiusPx > 0 ? c.panelBorderRadiusPx : 0
    ),
    featureTabsBlockMaxWidthPct: pick('featureTabsBlockMaxWidthPct', c.blockMaxWidthPct),
  };
}

const CHROME_KEYS = new Set([
  'featureTabsBarBg',
  'featureTabsActiveTabColor',
  'featureTabsActiveTabUnderline',
  'featureTabsPanelBg',
  'featureTabsPanelBorderColor',
  'featureTabsPanelBorderWidthPx',
  'featureTabsPanelRadiusPx',
  'featureTabsBlockMaxWidthPct',
]);

export function isFeatureTabsChromeKey(key) {
  return CHROME_KEYS.has(key) || key === 'featureTabsChromeReset';
}

/** Inspector form slice for tabs widget (or nested tabs under selection). */
export function featureTabsInspectorFormFromProps(props, pickPending) {
  const p = props && typeof props === 'object' ? props : {};
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  return {
    featureTabsJson: JSON.stringify(Array.isArray(p.tabs) ? p.tabs : [], null, 2),
    featureTabsActiveId: String(p.activeTabId || ''),
    featureTabsImageFit: String(p.imageFit || 'cover'),
    featureTabsImageHeightPx: String(Number(p.imageHeightPx) || 360),
    featureTabsTabAlign: String(p.tabAlign || 'center'),
    ...featureTabsChromeInspectorFields(p, pick),
  };
}

export function patchFeatureTabsChromeFromKey(key, value, prevChrome) {
  const prev = normalizeFeatureTabsChrome(prevChrome);
  const next = { ...prev };
  if (key === 'featureTabsBarBg') next.barBackgroundColor = String(value ?? '').trim();
  else if (key === 'featureTabsActiveTabColor') next.activeTabColor = String(value ?? '').trim();
  else if (key === 'featureTabsActiveTabUnderline') next.activeTabUnderlineColor = String(value ?? '').trim();
  else if (key === 'featureTabsPanelBg') next.panelBackgroundColor = String(value ?? '').trim();
  else if (key === 'featureTabsPanelBorderColor') next.panelBorderColor = String(value ?? '').trim();
  else if (key === 'featureTabsPanelBorderWidthPx') {
    next.panelBorderWidthPx = Math.max(0, Math.min(8, Math.round(Number(value) || 0)));
  } else if (key === 'featureTabsPanelRadiusPx') {
    next.panelBorderRadiusPx = Math.max(0, Math.min(48, Math.round(Number(value) || 0)));
  } else if (key === 'featureTabsBlockMaxWidthPct') {
    next.blockMaxWidthPct = Math.max(50, Math.min(100, Math.round(Number(value) || 100)));
  } else return null;
  return normalizeFeatureTabsChrome(next);
}
