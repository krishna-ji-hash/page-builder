import { decodePlainTextEntities, isProbablyInlineHtml } from './inlineTextHtml.js';
import { repairMojibakeText } from './textEncodingRepair.js';

export const DEFAULT_RICH_TEXT = {
  enabled: false,
  html: '',
  plainText: '',
};

export const DEFAULT_MARQUEE = {
  enabled: false,
  direction: 'left',
  speed: 'normal',
  duration: 18,
  pauseOnHover: true,
  loop: true,
  gapPx: 0,
  mobileEnabled: true,
};

export const DEFAULT_TEXT_BLOCK_ICON = {
  enabled: false,
  name: '★',
  position: 'before',
  color: '#2563eb',
  size: 16,
  spacing: 8,
};

/** Node types that support props.icon / props.marquee. */
export function supportsTextEffectsNodeType(nodeType) {
  return nodeType === 'text' || nodeType === 'paragraph' || nodeType === 'rich_text' || nodeType === 'heading';
}

/** Strip tags for plainText storage / fallbacks. */
export function htmlToPlainText(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Legacy `props.content` { mode, text, html } → richText shape. */
export function richTextFromLegacyContent(props) {
  const c = props?.content;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const mode = String(c.mode || '').trim().toLowerCase();
  const html = typeof c.html === 'string' ? c.html : '';
  const plain = typeof c.text === 'string' ? c.text : '';
  if (mode === 'rich' || (html.trim() && isProbablyInlineHtml(html))) {
    return {
      enabled: true,
      html: html.trim() || plain,
      plainText: htmlToPlainText(html) || plain,
    };
  }
  if (mode === 'plain') {
    return { enabled: false, html: '', plainText: plain };
  }
  return null;
}

export function normalizeRichTextProps(raw, fallbackText = '', legacyContent = null) {
  const rt =
    raw && typeof raw === 'object'
      ? raw
      : legacyContent && typeof legacyContent === 'object'
        ? legacyContent
        : {};
  const text = typeof fallbackText === 'string' ? fallbackText : '';
  let html = typeof rt.html === 'string' ? rt.html : '';
  let plainText = typeof rt.plainText === 'string' ? rt.plainText : '';
  if (!html && text && isProbablyInlineHtml(text)) html = text;
  if (!plainText) plainText = htmlToPlainText(html) || text;

  const shouldEnable = Boolean(rt.enabled) || isProbablyInlineHtml(text);

  return {
    enabled: shouldEnable,
    html,
    plainText: plainText || text,
  };
}

export function normalizeMarqueeProps(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const direction = m.direction === 'right' ? 'right' : 'left';
  const speed =
    m.speed === 'slow' || m.speed === 'fast' || m.speed === 'custom' ? m.speed : 'normal';
  const duration = Math.max(4, Math.min(120, Number(m.duration) || 18));
  const gapRaw = m.gapPx ?? m.gap;
  const gapDefault = Boolean(m.enabled) ? 40 : 0;
  const gapPx = Math.max(0, Math.min(240, Number(gapRaw) || gapDefault));
  return {
    enabled: Boolean(m.enabled),
    direction,
    speed,
    duration,
    pauseOnHover: m.pauseOnHover !== false,
    loop: m.loop !== false,
    gapPx,
    mobileEnabled: m.mobileEnabled !== false,
  };
}

export function normalizeTextBlockIconProps(raw) {
  const i = raw && typeof raw === 'object' ? raw : {};
  const position = i.position === 'after' ? 'after' : 'before';
  const size = Math.max(10, Math.min(96, Number(i.size) || 16));
  const spacing = Math.max(0, Math.min(64, Number(i.spacing) || 8));
  return {
    enabled: Boolean(i.enabled),
    name: typeof i.name === 'string' && i.name.trim() ? i.name.trim() : '★',
    position,
    color: typeof i.color === 'string' ? i.color.trim() : '',
    size,
    spacing,
  };
}

export function normalizeInlineTextProps(props = {}) {
  const text = decodePlainTextEntities(typeof props.text === 'string' ? props.text : '');
  const legacyRt = richTextFromLegacyContent(props);
  const richText = normalizeRichTextProps(props.richText, text, legacyRt);
  if (richText.plainText) {
    richText.plainText = decodePlainTextEntities(richText.plainText);
  }
  if (richText.html) {
    richText.html = repairMojibakeText(richText.html);
  }
  return {
    text,
    richText,
    marquee: normalizeMarqueeProps(props.marquee),
    icon: normalizeTextBlockIconProps(props.icon),
  };
}

export function resolveInlineTextHtml(normalized) {
  const { richText, text } = normalized;
  if (richText.enabled && String(richText.html || '').trim()) {
    return String(richText.html).trim();
  }
  if (isProbablyInlineHtml(text)) return text.trim();
  return '';
}

export function resolveMarqueeDurationSec(marquee) {
  const dur = Number(marquee?.duration);
  if (Number.isFinite(dur) && dur >= 4) {
    return Math.max(4, Math.min(120, dur));
  }
  if (marquee.speed === 'slow') return 28;
  if (marquee.speed === 'fast') return 12;
  return 18;
}

export function marqueeStyleFromProps(marquee) {
  if (!marquee?.enabled) return null;
  return {
    '--bld-marquee-duration': `${resolveMarqueeDurationSec(marquee)}s`,
    '--bld-marquee-gap': `${marquee.gapPx ?? 48}px`,
  };
}

export function inlineTextFormFromProps(props = {}) {
  const n = normalizeInlineTextProps(props);
  return {
    inlineTextMode: n.richText.enabled ? 'rich' : 'plain',
    richTextHtml: n.richText.html || n.text || '',
    marqueeEnabled: n.marquee.enabled,
    marqueeDirection: n.marquee.direction,
    marqueeSpeed: n.marquee.speed,
    marqueeDuration: n.marquee.duration,
    marqueePauseOnHover: n.marquee.pauseOnHover,
    marqueeLoop: n.marquee.loop,
    marqueeGapPx: n.marquee.gapPx,
    marqueeMobileEnabled: n.marquee.mobileEnabled,
    textBlockIconEnabled: n.icon.enabled,
    textBlockIconName: n.icon.name,
    textBlockIconPosition: n.icon.position,
    textBlockIconColor: n.icon.color,
    textBlockIconSize: n.icon.size,
    textBlockIconSpacing: n.icon.spacing,
  };
}

const INLINE_TEXT_INSPECTOR_KEYS = new Set([
  'inlineTextMode',
  'richTextHtml',
  'marqueeEnabled',
  'marqueeDirection',
  'marqueeSpeed',
  'marqueeDuration',
  'marqueePauseOnHover',
  'marqueeLoop',
  'marqueeGapPx',
  'marqueeMobileEnabled',
  'textBlockIconEnabled',
  'textBlockIconName',
  'textBlockIconPosition',
  'textBlockIconColor',
  'textBlockIconSize',
  'textBlockIconSpacing',
]);

export function isInlineTextInspectorKey(key) {
  return INLINE_TEXT_INSPECTOR_KEYS.has(key);
}

export function isTextEffectsInspectorKey(key) {
  return (
    key.startsWith('marquee') ||
    key.startsWith('textBlockIcon')
  );
}

/**
 * @returns {{ patch: object } | null}
 */
export function buildInlineTextPropsPatch(nodeProps, key, value) {
  const props = nodeProps && typeof nodeProps === 'object' ? nodeProps : {};
  const text = typeof props.text === 'string' ? props.text : '';
  const richText = { ...normalizeRichTextProps(props.richText, text) };
  const marquee = { ...normalizeMarqueeProps(props.marquee) };
  const icon = { ...normalizeTextBlockIconProps(props.icon) };

  if (key === 'inlineTextMode') {
    const enable = value === 'rich';
    richText.enabled = enable;
    if (enable && !richText.html.trim()) {
      richText.html = text;
      richText.plainText = htmlToPlainText(text) || text;
    }
    if (!enable) {
      const plain = richText.plainText || htmlToPlainText(richText.html) || text;
      richText.enabled = false;
      return { patch: { richText, text: plain } };
    }
    return { patch: { richText } };
  }

  if (key === 'richTextHtml') {
    const html = String(value ?? '');
    richText.enabled = true;
    richText.html = html;
    richText.plainText = htmlToPlainText(html) || text;
    return { patch: { richText, text: richText.plainText || text } };
  }

  if (key === 'marqueeEnabled') marquee.enabled = Boolean(value);
  if (key === 'marqueeDirection') marquee.direction = value === 'right' ? 'right' : 'left';
  if (key === 'marqueeSpeed') {
    marquee.speed =
      value === 'slow' || value === 'fast' || value === 'custom' ? value : 'normal';
  }
  if (key === 'marqueeDuration') {
    marquee.duration = Math.max(4, Math.min(120, Number(value) || 18));
    marquee.speed = 'custom';
  }
  if (key === 'marqueePauseOnHover') marquee.pauseOnHover = Boolean(value);
  if (key === 'marqueeLoop') marquee.loop = Boolean(value);
  if (key === 'marqueeGapPx') marquee.gapPx = Math.max(0, Math.min(240, Number(value) || 0));
  if (key === 'marqueeMobileEnabled') marquee.mobileEnabled = Boolean(value);

  if (key === 'textBlockIconEnabled') icon.enabled = Boolean(value);
  if (key === 'textBlockIconName') icon.name = String(value || '★').trim() || '★';
  if (key === 'textBlockIconPosition') icon.position = value === 'after' ? 'after' : 'before';
  if (key === 'textBlockIconColor') icon.color = String(value || '').trim();
  if (key === 'textBlockIconSize') icon.size = Math.max(10, Math.min(96, Number(value) || 16));
  if (key === 'textBlockIconSpacing') icon.spacing = Math.max(0, Math.min(64, Number(value) || 8));

  if (key.startsWith('marquee') || key.startsWith('textBlockIcon')) {
    return { patch: { marquee, icon } };
  }

  return null;
}

/** Merge inline edit / plain `text` updates with richText storage. */
export function propsPatchForTextContent(nodeProps, nextText) {
  const props = nodeProps && typeof nodeProps === 'object' ? nodeProps : {};
  const richText = normalizeRichTextProps(props.richText, props.text || '');
  const decoded = decodePlainTextEntities(String(nextText ?? ''));
  const patch = { text: decoded };
  if (richText.enabled || isProbablyInlineHtml(decoded)) {
    patch.richText = {
      enabled: true,
      html: decoded,
      plainText: htmlToPlainText(decoded) || decoded,
    };
  }
  return patch;
}
