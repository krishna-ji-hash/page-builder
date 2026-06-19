import { normalizeRedirectPath } from './seoPageHelpers.js';

export { normalizeRedirectPath };

export function validateRedirectLoops(redirects) {
  const active = (redirects || []).filter((r) => r.active !== false);
  const map = new Map(active.map((r) => [r.sourcePath, r.destinationPath]));
  const loops = [];
  for (const [start] of map) {
    const seen = new Set();
    let cur = start;
    while (map.has(cur)) {
      if (seen.has(cur)) {
        loops.push(start);
        break;
      }
      seen.add(cur);
      cur = map.get(cur);
      if (cur === start) {
        loops.push(start);
        break;
      }
    }
  }
  return loops;
}
