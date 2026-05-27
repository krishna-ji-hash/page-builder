/**
 * CSS class hooks for live/published pages.
 * Builder preview uses `data-bld-device` + getDeviceStyle(); live uses viewport @media + these classes.
 */

function readLayoutLayer(styleJson, deviceKey) {
  if (!styleJson || typeof styleJson !== 'object') return null;
  if (deviceKey === 'desktop') {
    if (styleJson.desktop && typeof styleJson.desktop === 'object') {
      return styleJson.desktop.layout || null;
    }
    return styleJson.layout || null;
  }
  const layer = styleJson[deviceKey];
  return layer && typeof layer === 'object' ? layer.layout || null : null;
}

function isRowDirection(dir) {
  const d = String(dir || '').toLowerCase();
  return d === 'row' || d === 'row-reverse';
}

function isColumnDirection(dir) {
  const d = String(dir || '').toLowerCase();
  return d === 'column' || d === 'column-reverse';
}

/**
 * @param {Record<string, unknown>|null|undefined} styleJson
 * @returns {string} space-separated class names
 */
export function liveResponsiveLayoutClasses(styleJson) {
  if (!styleJson || typeof styleJson !== 'object') return '';
  const classes = [];
  const desk = readLayoutLayer(styleJson, 'desktop');
  const mob = readLayoutLayer(styleJson, 'mobile');
  const tab = readLayoutLayer(styleJson, 'tablet');

  if (mob && isColumnDirection(mob.flexDirection) && isRowDirection(desk?.flexDirection)) {
    classes.push('live-mobile-stack');
  }
  if (tab?.flexWrap === 'wrap' && desk?.flexWrap === 'nowrap') {
    classes.push('live-tablet-wrap');
  }
  return classes.join(' ');
}
