/**
 * Freeze project global header/footer into published page snapshot at publish time.
 * Live routes must use snapshot.globalSections — not mutable projects.config_json.
 */

function deepCloneJson(value) {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Copy active global header/footer from project config for embedding in published snapshot_json.
 * @param {object | null | undefined} projectConfig
 * @returns {{ header: object | null, footer: object | null }}
 */
export function freezeGlobalSectionsForPublish(projectConfig) {
  const gs =
    projectConfig && typeof projectConfig === 'object' && projectConfig.globalSections
      ? projectConfig.globalSections
      : {};
  const header =
    gs.header && typeof gs.header === 'object' && gs.header.nodeType === 'row'
      ? deepCloneJson(gs.header)
      : null;
  const footer =
    gs.footer && typeof gs.footer === 'object' && gs.footer.nodeType === 'row'
      ? deepCloneJson(gs.footer)
      : null;
  return { header, footer };
}

/** @returns {{ header: object | null, footer: object | null }} */
export function emptyFrozenGlobalSections() {
  return { header: null, footer: null };
}
