const DEVICE_KEYS = ['desktop', 'tablet', 'mobile'];

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function clampDuration(v, factor = 0.5) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0.3;
  return Math.max(0.15, Math.min(2, n * factor));
}

function clampDelay(v, factor = 0.5) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.min(1.5, n * factor));
}

/** Reduce animation duration/delay on a single node's style_json (override-only layers). */
export function buildReduceAnimationIntensityStyleJson(styleJson) {
  const base = isPlainObject(styleJson) ? styleJson : {};
  const next = { ...base };

  for (const deviceKey of DEVICE_KEYS) {
    const layer = isPlainObject(next[deviceKey]) ? { ...next[deviceKey] } : null;
    if (!layer) continue;
    const ix = isPlainObject(layer.interactions) ? { ...layer.interactions } : null;
    if (!ix) continue;
    const anim = isPlainObject(ix.animation) ? { ...ix.animation } : null;
    if (!anim || String(anim.preset || 'none') === 'none') continue;
    ix.animation = {
      ...anim,
      duration: clampDuration(anim.duration),
      delay: clampDelay(anim.delay),
    };
    layer.interactions = ix;
    next[deviceKey] = layer;
  }

  return next;
}

/** Collect node ids that have active entrance animations in style_json. */
export function collectAnimatedNodeIds(tree) {
  const ids = [];
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (!n) continue;
      const style = isPlainObject(n.style_json) ? n.style_json : {};
      const hasAnim = DEVICE_KEYS.some((dk) => {
        const preset = style?.[dk]?.interactions?.animation?.preset;
        return preset && String(preset) !== 'none';
      });
      if (hasAnim) ids.push(n.id);
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };
  walk(Array.isArray(tree) ? tree : []);
  return ids;
}
