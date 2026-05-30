import { hasModePalettes } from './themeTokens.js';
import { resolveFontStack } from './fontPresets.js';

const DEVICE_KEYS = ['desktop', 'tablet', 'mobile'];

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function patchTokenLayer(prev, group, patch) {
  const mode = prev.mode === 'dark' ? 'dark' : 'light';
  if (hasModePalettes(prev)) {
    return {
      ...prev,
      [mode]: {
        ...(prev[mode] || {}),
        [group]: { ...(prev[mode]?.[group] || {}), ...patch },
      },
    };
  }
  return {
    ...prev,
    [group]: { ...(prev[group] || {}), ...patch },
  };
}

/**
 * Keep `siteTheme.colors` and active `themeTokens` palette in sync when brand colors change.
 * @param {object} colorPatch — keys: primary, text, muted, background, surface
 */
export function syncBrandColorsToThemeTokens(themeTokens, colorPatch) {
  if (!isPlainObject(colorPatch) || Object.keys(colorPatch).length === 0) {
    return themeTokens;
  }
  const tokenColors = {};
  if (colorPatch.primary) tokenColors.primary = colorPatch.primary;
  if (colorPatch.text) tokenColors.text = colorPatch.text;
  if (colorPatch.muted) tokenColors.muted = colorPatch.muted;
  if (colorPatch.background) tokenColors.background = colorPatch.background;
  if (colorPatch.surface) tokenColors.surface = colorPatch.surface;
  if (Object.keys(tokenColors).length === 0) return themeTokens;
  return patchTokenLayer(themeTokens, 'colors', tokenColors);
}

/** Sync unified project font to token typography layers. */
export function syncBrandFontToThemeTokens(themeTokens, fontStack) {
  const stack = resolveFontStack(fontStack);
  if (!stack) return themeTokens;
  return patchTokenLayer(themeTokens, 'typography', {
    fontFamilyBody: stack,
    fontFamilyHeading: stack,
  });
}

function layerHasExplicitFont(layer) {
  const fam = layer?.typography?.fontFamily;
  return fam !== undefined && fam !== null && String(fam).trim() !== '';
}

/** Widget explicitly chose its own font in Style → Typography. */
export function nodeHasUserFontOverride(treeNode) {
  const meta = treeNode?.props?.meta;
  return Boolean(meta && typeof meta === 'object' && meta.userFontOverride === true);
}

/** Strip fontFamily from a single device style layer (for theme merge). */
export function stripFontFamilyFromStyleLayer(layer) {
  if (!isPlainObject(layer) || !layerHasExplicitFont(layer)) return layer;
  const layerNext = { ...layer };
  const typo = { ...(layer.typography || {}) };
  delete typo.fontFamily;
  if (Object.keys(typo).length > 0) layerNext.typography = typo;
  else delete layerNext.typography;
  return layerNext;
}

export function propsClearingUserFontOverride(props) {
  if (!props?.meta?.userFontOverride) return undefined;
  const meta = { ...(props.meta || {}), userFontOverride: false };
  return { ...props, meta };
}

/** @param {object|null|undefined} styleJson */
export function styleJsonHasExplicitFontFamily(styleJson) {
  if (!isPlainObject(styleJson)) return false;
  return DEVICE_KEYS.some((dk) => layerHasExplicitFont(styleJson[dk]));
}

/** Remove per-widget fontFamily overrides so project theme font applies. */
export function stripExplicitFontFamilyFromStyleJson(styleJson) {
  if (!isPlainObject(styleJson)) return styleJson;
  let changed = false;
  const next = { ...styleJson };

  for (const dk of DEVICE_KEYS) {
    const layer = next[dk];
    if (!layerHasExplicitFont(layer)) continue;
    changed = true;
    const layerNext = { ...layer };
    const typo = { ...(layer.typography || {}) };
    delete typo.fontFamily;
    if (Object.keys(typo).length > 0) {
      layerNext.typography = typo;
    } else {
      delete layerNext.typography;
    }
    next[dk] = layerNext;
  }

  return changed ? next : styleJson;
}

/** Count widgets where the user explicitly set a custom font. */
export function countUserFontOverrideNodes(tree) {
  let count = 0;
  walkNodes(tree, (node) => {
    if (nodeHasUserFontOverride(node)) count += 1;
  });
  return count;
}

/** @deprecated use countUserFontOverrideNodes */
export function countNodesWithExplicitFontFamily(tree) {
  return countUserFontOverrideNodes(tree);
}

/** True when new style_json only removes stored fontFamily (brand normalize). */
export function isBrandFontNormalizeStyleJson(before, after) {
  if (!isPlainObject(before) || !isPlainObject(after)) return false;
  const expected = stripExplicitFontFamilyFromStyleJson(before);
  try {
    return JSON.stringify(expected) === JSON.stringify(after);
  } catch {
    return false;
  }
}

/** Collect patches to persist brand font cleanup (optional — render already uses project font). */
export function collectBrandFontClearPatches(tree) {
  const patches = [];
  walkNodes(tree, (node) => {
    const id = Number(node?.id);
    if (!Number.isInteger(id) || id <= 0) return;
    const nextStyle = stripExplicitFontFamilyFromStyleJson(node.style_json);
    const nextProps = propsClearingUserFontOverride(node.props);
    const styleChanged = nextStyle !== node.style_json;
    const propsChanged = nextProps !== undefined;
    if (!styleChanged && !propsChanged) return;
    const payload = { brandFontNormalize: true };
    if (styleChanged) payload.style_json = nextStyle;
    if (propsChanged) payload.props = nextProps;
    patches.push({ nodeId: id, payload });
  });
  return patches;
}

/** Apply brand font cleanup to an in-memory tree (instant canvas preview). */
export function applyBrandFontToTree(tree) {
  return walkMapTree(tree, (node) => {
    const nextStyle = stripExplicitFontFamilyFromStyleJson(node.style_json);
    const nextProps = propsClearingUserFontOverride(node.props);
    if (nextStyle === node.style_json && nextProps === undefined) return node;
    return {
      ...node,
      style_json: nextStyle,
      props: nextProps ?? node.props,
    };
  });
}

function walkMapTree(nodes, mapper) {
  return (nodes || []).map((node) => {
    if (!node) return node;
    const mapped = mapper(node);
    if (Array.isArray(mapped.children) && mapped.children.length) {
      return { ...mapped, children: walkMapTree(mapped.children, mapper) };
    }
    return mapped;
  });
}

function walkNodes(nodes, visit) {
  for (const node of nodes || []) {
    if (!node) continue;
    visit(node);
    if (Array.isArray(node.children) && node.children.length) {
      walkNodes(node.children, visit);
    }
  }
}
