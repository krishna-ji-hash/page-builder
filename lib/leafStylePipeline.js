import { getDeviceStyle } from './styleToCss.js';
import { mergeLeafTypographicAlignmentLayout } from './nodeLayoutDefaults.js';
import { normalizeHeadingLevel, semanticHeadingTypography } from './headingLevel.js';

/**
 * When no `typography.fontSize` is stored for this device layer, apply a clear h1–h6 scale so the Level
 * control matches what users see (templates often omit fontSize or use a single body size).
 */
export function withHeadingSemanticTypographyIfNeeded(node, device, mergedDeviceStyle) {
  if (node?.nodeType !== 'heading' || !mergedDeviceStyle || typeof mergedDeviceStyle !== 'object') {
    return mergedDeviceStyle;
  }
  const raw = getDeviceStyle(node.style_json || {}, device);
  const persisted = raw?.typography?.fontSize;
  if (persisted != null && persisted !== '') return mergedDeviceStyle;
  const tag = normalizeHeadingLevel(node.props?.tag);
  const typo = semanticHeadingTypography(tag);
  return {
    ...mergedDeviceStyle,
    typography: { ...(mergedDeviceStyle.typography || {}), ...typo },
  };
}

/**
 * Plain `text` blocks: newline characters in props only show if CSS `white-space` allows it.
 * Default to pre-wrap when the user has not set a value in style_json (Enter in inline edit / Content).
 */
function withPlainTextLineBreakDefaults(node, device, mergedDeviceStyle) {
  if (node?.nodeType !== 'text' || !mergedDeviceStyle || typeof mergedDeviceStyle !== 'object') {
    return mergedDeviceStyle;
  }
  const raw = getDeviceStyle(node.style_json || {}, device);
  const persisted = raw?.typography?.whiteSpace ?? raw?.layout?.whiteSpace;
  if (persisted != null && String(persisted).trim() !== '') return mergedDeviceStyle;
  return {
    ...mergedDeviceStyle,
    typography: {
      ...(mergedDeviceStyle.typography || {}),
      whiteSpace: 'pre-wrap',
    },
  };
}

/** After `mergeDeviceStyleWithTypeDefaults`, apply leaf-only heading + alignment layout rules. */
export function finalizeLeafDeviceStyle(node, device, mergedWithTypeDefaults) {
  const aligned = mergeLeafTypographicAlignmentLayout(node?.nodeType, mergedWithTypeDefaults);
  const withHeading = withHeadingSemanticTypographyIfNeeded(node, device, aligned);
  return withPlainTextLineBreakDefaults(node, device, withHeading);
}
