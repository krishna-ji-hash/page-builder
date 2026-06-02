import { normalizeToolbarTextAlign } from './toolbarTextAlign.js';

/**
 * When text marquee runs, background/padding on the text leaf must stay on a static
 * full-width shell — only typography scrolls inside the track.
 */

const PADDING_KEYS = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
];

const SHELL_BOX_KEYS = [
  'background',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'border',
  'borderRadius',
  'boxShadow',
  'width',
  'minWidth',
  'maxWidth',
];

/**
 * @param {Record<string, unknown>|null|undefined} style
 * @returns {{ shellStyle: Record<string, unknown>, textStyle: Record<string, unknown> }}
 */
export function splitStylesForTextMarquee(style = {}) {
  const src = style && typeof style === 'object' ? { ...style } : {};
  const shellStyle = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    display: 'block',
  };
  const textStyle = { ...src };

  for (const key of SHELL_BOX_KEYS) {
    if (src[key] != null && src[key] !== '') {
      shellStyle[key] = src[key];
      delete textStyle[key];
    }
  }

  for (const key of PADDING_KEYS) {
    if (src[key] != null && src[key] !== '') {
      shellStyle[key] = src[key];
      delete textStyle[key];
    }
  }

  if (src.textAlign) {
    shellStyle.textAlign = src.textAlign;
  }

  textStyle.display = 'inline';
  textStyle.background = 'transparent';
  textStyle.backgroundColor = 'transparent';
  textStyle.backgroundImage = 'none';
  textStyle.boxShadow = 'none';
  textStyle.border = 'none';
  textStyle.borderRadius = 0;
  textStyle.width = 'auto';
  textStyle.maxWidth = 'none';
  textStyle.minWidth = 0;
  textStyle.margin = 0;
  textStyle.whiteSpace = 'nowrap';
  if (src.lineHeight != null && src.lineHeight !== '') {
    textStyle.lineHeight = src.lineHeight;
  }
  if (src.fontSize != null && src.fontSize !== '') {
    textStyle.fontSize = src.fontSize;
  }

  shellStyle.width = '100%';
  shellStyle.maxWidth = '100%';
  shellStyle.minWidth = 0;
  shellStyle.position = 'relative';
  shellStyle.transform = 'none';
  shellStyle.left = 'auto';
  shellStyle.top = 'auto';
  shellStyle.right = 'auto';
  shellStyle.bottom = 'auto';
  shellStyle.display = 'flex';
  shellStyle.alignItems = 'center';
  shellStyle.boxSizing = 'border-box';

  return { shellStyle, textStyle };
}

/** @param {Record<string, unknown>|null|undefined} style */
export function marqueeTextAlignFromStyle(style = {}) {
  const raw = style?.textAlign ?? style?.['text-align'];
  return normalizeToolbarTextAlign(raw);
}
