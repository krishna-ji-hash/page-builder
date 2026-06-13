/** Canonical admin activity log action keys. */

export const ACTIVITY_ACTIONS = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROJECT_CREATED: 'project.created',
  PAGE_CREATED: 'page.created',
  DRAFT_SAVED: 'draft.saved',
  PAGE_PUBLISHED: 'page.published',
  PAGE_UNPUBLISHED: 'page.unpublished',
  VERSION_RESTORED: 'version.restored',
  DOMAIN_ADDED: 'domain.added',
  DOMAIN_VERIFIED: 'domain.verified',
  FORM_EXPORTED: 'form.exported',
  BACKUP_EXPORTED: 'backup.exported',
  PASSWORD_CHANGED: 'password.changed',
});

export const ACTIVITY_ACTION_LABELS = Object.freeze({
  [ACTIVITY_ACTIONS.LOGIN]: 'Signed in',
  [ACTIVITY_ACTIONS.LOGOUT]: 'Signed out',
  [ACTIVITY_ACTIONS.PROJECT_CREATED]: 'Project created',
  [ACTIVITY_ACTIONS.PAGE_CREATED]: 'Page created',
  [ACTIVITY_ACTIONS.DRAFT_SAVED]: 'Draft saved',
  [ACTIVITY_ACTIONS.PAGE_PUBLISHED]: 'Page published',
  [ACTIVITY_ACTIONS.PAGE_UNPUBLISHED]: 'Page unpublished',
  [ACTIVITY_ACTIONS.VERSION_RESTORED]: 'Version restored to draft',
  [ACTIVITY_ACTIONS.DOMAIN_ADDED]: 'Domain added',
  [ACTIVITY_ACTIONS.DOMAIN_VERIFIED]: 'Domain verified',
  [ACTIVITY_ACTIONS.FORM_EXPORTED]: 'Form submissions exported',
  [ACTIVITY_ACTIONS.BACKUP_EXPORTED]: 'Project backup exported',
  [ACTIVITY_ACTIONS.PASSWORD_CHANGED]: 'Password changed',
});

export function activityActionLabel(action) {
  return ACTIVITY_ACTION_LABELS[action] || String(action || 'Activity');
}

/** Visual metadata for activity feed UI */
export function activityActionMeta(action) {
  const key = String(action || '');
  const map = {
    [ACTIVITY_ACTIONS.LOGIN]: { tone: 'auth', icon: '→' },
    [ACTIVITY_ACTIONS.LOGOUT]: { tone: 'auth', icon: '←' },
    [ACTIVITY_ACTIONS.PROJECT_CREATED]: { tone: 'create', icon: '+' },
    [ACTIVITY_ACTIONS.PAGE_CREATED]: { tone: 'create', icon: '◫' },
    [ACTIVITY_ACTIONS.DRAFT_SAVED]: { tone: 'draft', icon: '✎' },
    [ACTIVITY_ACTIONS.PAGE_PUBLISHED]: { tone: 'publish', icon: '↑' },
    [ACTIVITY_ACTIONS.PAGE_UNPUBLISHED]: { tone: 'offline', icon: '↓' },
    [ACTIVITY_ACTIONS.VERSION_RESTORED]: { tone: 'restore', icon: '↺' },
    [ACTIVITY_ACTIONS.DOMAIN_ADDED]: { tone: 'domain', icon: '◎' },
    [ACTIVITY_ACTIONS.DOMAIN_VERIFIED]: { tone: 'domain', icon: '✓' },
    [ACTIVITY_ACTIONS.FORM_EXPORTED]: { tone: 'export', icon: '⤓' },
    [ACTIVITY_ACTIONS.BACKUP_EXPORTED]: { tone: 'export', icon: '⤓' },
    [ACTIVITY_ACTIONS.PASSWORD_CHANGED]: { tone: 'auth', icon: '🔒' },
  };
  return map[key] || { tone: 'default', icon: '•' };
}
