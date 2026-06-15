export const ADMIN_THEME_STORAGE_KEY = 'admin-theme';

export function readAdminTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function persistAdminTheme(theme) {
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}
