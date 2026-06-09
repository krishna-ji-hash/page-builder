import { featureTabFieldHasInlineHtml, sanitizeFeatureTabFieldHtml } from './featureTabInlineHtml.js';
import { collapseRepeatedAmpEntities, isProbablyInlineHtml } from './inlineTextHtml.js';
import { DEFAULT_TAB_HERO_PANELS, TAB_HERO_PANEL_IMAGES } from './tabHeroPanelSeed.js';

/** Tab-based hero banner — nav tabs + full-bleed image + overlay content card. */

export { DEFAULT_TAB_HERO_PANELS };

const PANEL_IMAGES = TAB_HERO_PANEL_IMAGES;

function decodeHtmlEntitiesOnce(raw) {
  return collapseRepeatedAmpEntities(String(raw))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Recover plain text / inline HTML corrupted by htmlMode mismatch + toolbar round-trips. */
export function recoverTabHeroInlineField(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  if (!/&lt;|&amp;lt;|&amp;gt;/i.test(s) && !/^<span[\s>]/i.test(s)) {
    return s;
  }
  let prev;
  let guard = 0;
  do {
    prev = s;
    s = decodeHtmlEntitiesOnce(s);
    guard += 1;
  } while (s !== prev && guard < 16 && /&lt;|&amp;lt;|&amp;/i.test(s));

  if (!isProbablyInlineHtml(s)) {
    return s.trim();
  }

  const textOnly = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
  const hasRichTags = /<(b|strong|i|em|u|a)\b/i.test(s);
  const hasFontSize = /font-size\s*:/i.test(s);

  if (!hasRichTags && !hasFontSize) {
    return textOnly || s.trim();
  }
  if (featureTabFieldHasInlineHtml(s)) {
    return sanitizeFeatureTabFieldHtml(s);
  }
  return textOnly || s.trim();
}

/**
 * @param {unknown} panel
 * @param {number} index
 */
export function normalizeTabHeroPanel(panel, index = 0) {
  const p = panel && typeof panel === 'object' ? panel : {};
  const id = String(p.id || `panel-${index + 1}`).trim() || `panel-${index + 1}`;
  const fallbackImg = PANEL_IMAGES[index % PANEL_IMAGES.length] || '/builder-placeholder.svg';
  const imageSrcRaw = String(p.imageSrc || p.image || '').trim();
  const imageSrc =
    !imageSrcRaw || imageSrcRaw === '/builder-placeholder.svg' ? fallbackImg : imageSrcRaw;
  return {
    id,
    label: String(p.label || `Tab ${index + 1}`).trim() || `Tab ${index + 1}`,
    eyebrow: recoverTabHeroInlineField(p.eyebrow || p.badge || ''),
    heading: recoverTabHeroInlineField(p.heading || p.title || ''),
    paragraph: recoverTabHeroInlineField(p.paragraph || p.body || ''),
    ctaLabel: String(p.ctaLabel || p.buttonText || 'Learn more').trim() || 'Learn more',
    ctaHref: String(p.ctaHref || p.buttonUrl || p.href || '#').trim() || '#',
    imageSrc,
    imageAlt: String(p.imageAlt || p.label || 'Hero background').trim(),
  };
}

/**
 * @param {unknown} panels
 */
export function normalizeTabHeroPanels(panels) {
  if (!Array.isArray(panels)) {
    return DEFAULT_TAB_HERO_PANELS.map((panel, i) => normalizeTabHeroPanel(panel, i));
  }
  const out = panels
    .filter((p) => p && typeof p === 'object')
    .map((panel, index) => normalizeTabHeroPanel(panel, index));
  return out.length ? out : DEFAULT_TAB_HERO_PANELS.map((panel, i) => normalizeTabHeroPanel(panel, i));
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveTabHeroProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const panels = normalizeTabHeroPanels(p.panels);
  const firstPanelId = String(panels[0]?.id || '').trim();
  const defaultTabExplicit = p.defaultTabExplicit === true;
  const requestedActive = String(p.activePanelId || firstPanelId).trim();
  const activePanelId = defaultTabExplicit ? requestedActive : firstPanelId;
  const validActive = panels.some((panel) => panel.id === activePanelId) ? activePanelId : firstPanelId;
  const alignRaw = String(p.tabAlign || 'center').trim().toLowerCase();
  const tabAlign = alignRaw === 'left' || alignRaw === 'stretch' ? alignRaw : 'center';
  return { panels, activePanelId: validActive, tabAlign };
}

/**
 * @param {ReturnType<typeof normalizeTabHeroPanel>[]} panels
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
/**
 * Active panel id from builder DOM (tab button or visible tabpanel).
 * @param {ParentNode | null | undefined} shell
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveActiveTabHeroPanelIdFromDom(shell, props) {
  const { panels, activePanelId } = resolveTabHeroProps(props);
  const root = shell && typeof shell.querySelector === 'function' ? shell : null;
  if (!root) return activePanelId || panels[0]?.id || '';
  const activeTab = root.querySelector('.live-tab-hero__tab.is-active');
  const controlsId = String(activeTab?.getAttribute('aria-controls') || '').trim();
  if (controlsId) {
    const match = panels.find((panel) => controlsId.endsWith(`-${panel.id}`) || controlsId.includes(panel.id));
    if (match?.id) return match.id;
  }
  const panelEl = root.querySelector('.live-tab-hero__stage[role="tabpanel"]');
  const panelDomId = String(panelEl?.id || '').trim();
  if (panelDomId) {
    const match = panels.find((panel) => panelDomId.endsWith(`-${panel.id}`) || panelDomId.includes(panel.id));
    if (match?.id) return match.id;
  }
  return activePanelId || panels[0]?.id || '';
}

export function patchTabHeroPanel(panels, index, patch) {
  const list = Array.isArray(panels) ? [...panels] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  list[index] = normalizeTabHeroPanel({ ...(list[index] || {}), ...patch }, index);
  return list;
}

/** @param {ReturnType<typeof normalizeTabHeroPanel>[]} panels */
export function newTabHeroPanelFromList(panels) {
  const list = Array.isArray(panels) ? panels : [];
  const n = list.length + 1;
  const base = list[list.length - 1] || DEFAULT_TAB_HERO_PANELS[0];
  return normalizeTabHeroPanel(
    {
      id: `panel-${Date.now().toString(36)}`,
      label: `New tab ${n}`,
      eyebrow: 'Dispatch',
      heading: 'Add your headline here',
      paragraph: 'Describe this use case in one or two sentences.',
      ctaLabel: 'Learn more',
      ctaHref: '#',
      imageSrc: base?.imageSrc || PANEL_IMAGES[0],
      imageAlt: 'Hero background',
    },
    n - 1
  );
}
