/** Fired when admin project list changes (create, archive, delete). */
export const PROJECT_LIST_CHANGED = 'admin:project-list-changed';

export function dispatchProjectListChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_LIST_CHANGED));
}
