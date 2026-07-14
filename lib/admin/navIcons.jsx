/** Sidebar + workspace nav icons — shared across AdminShell */

export const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  projects: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 5.5h13v9a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013.5 14.5v-9z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 5.5V4a1 1 0 011-1h4a1 1 0 011 1v1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  publishing: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  health: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 10h2.5l2-4 3 8 2-4h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16c.3-1.8 1.5-3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  roles: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3l6.5 3v5c0 3.5-2.8 5.5-6.5 6-3.7-.5-6.5-2.5-6.5-6V6L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export const WORKSPACE_ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  pages: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 3.5h6l3 3v10a1 1 0 01-1 1h-8a1 1 0 01-1-1v-12a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 3.5V7h3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  cms: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <ellipse cx="10" cy="5.5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 5.5v4c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-4M4.5 9.5v4c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2v-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 4.5h11v11h-11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 8h6M7 10.5h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  forms: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4.5" y="3.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  seo: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  domains: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 10h13M10 3.5c2 2 3 4.5 3 6.5s-1 4.5-3 6.5M10 3.5c-2 2-3 4.5-3 6.5s1 4.5 3 6.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  publishing: NAV_ICONS.publishing,
  media: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 13l-3.5-3-2.5 2.5-2-2L4 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  theme: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h1M15 10h1M6.2 6.2l.7.7M13.1 13.1l.7.7M6.2 13.8l.7-.7M13.1 6.9l.7-.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export function workspaceIcon(sectionId) {
  return WORKSPACE_ICONS[sectionId] || NAV_ICONS.projects;
}

export const SETTINGS_ICON = {
  users: NAV_ICONS.users,
  roles: NAV_ICONS.roles,
  system: NAV_ICONS.system,
};
