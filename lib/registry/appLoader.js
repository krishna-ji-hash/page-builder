import { APP_MANIFESTS } from '../../apps/manifests.js';
import { resetAppRegistry } from './appRegistry.js';

const manifestsById = new Map(APP_MANIFESTS.map((m) => [m.id, m]));

let lastLoadedKey = '';

function normalizeEnabled(enabled) {
  const ids = Array.isArray(enabled) ? enabled.map(String) : [];
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  return uniq;
}

function buildKey(projectId, enabledIds) {
  return `${projectId || 0}:${enabledIds.sort().join(',')}`;
}

/**
 * Load only enabled apps (lazy imports) and register contributions.
 * Safe: registry reset occurs before loading.
 */
export async function loadAppsForProject({ projectId, enabledAppIds }) {
  const enabled = normalizeEnabled(enabledAppIds);
  const key = buildKey(projectId, [...enabled]);
  if (key === lastLoadedKey) return { ok: true, loaded: enabled };

  resetAppRegistry();

  for (const id of enabled) {
    const m = manifestsById.get(id);
    if (!m) continue;
    await m.import();
  }

  lastLoadedKey = key;
  return { ok: true, loaded: enabled };
}

export function listAvailableApps() {
  return APP_MANIFESTS.map(({ import: _imp, ...rest }) => rest);
}

