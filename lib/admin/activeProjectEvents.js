/** Browser event when the localhost default project changes. */
export const ACTIVE_PROJECT_CHANGED = 'admin:active-project-changed';

/**
 * @param {number | string | null | undefined} projectId
 */
export function dispatchActiveProjectChanged(projectId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROJECT_CHANGED, {
      detail: { projectId: projectId != null ? Number(projectId) : null },
    })
  );
}
