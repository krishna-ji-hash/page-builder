import { ROLE_RANK, ROLES } from '../auth/constants.js';

/** Permission cell values rendered in the roles matrix. */
export const PERM = Object.freeze({
  FULL: 'full',
  MANAGE: 'manage',
  WRITE: 'write',
  READ: 'read',
  NONE: 'none',
});

export const PERM_LABELS = Object.freeze({
  [PERM.FULL]: 'Full access',
  [PERM.MANAGE]: 'Manage',
  [PERM.WRITE]: 'Read & write',
  [PERM.READ]: 'Read only',
  [PERM.NONE]: 'No access',
});

export const PERMISSION_MODULES = Object.freeze([
  { id: 'builder', label: 'Builder & pages', hint: 'Edit page trees and widgets' },
  { id: 'publishing', label: 'Publishing', hint: 'Publish and unpublish pages' },
  { id: 'media', label: 'Media library', hint: 'Upload and manage assets' },
  { id: 'cms', label: 'CMS', hint: 'Collections and content items' },
  { id: 'seo', label: 'SEO suite', hint: 'Defaults, audit, and sitemap' },
  { id: 'domains', label: 'Domains', hint: 'Custom domains and DNS' },
  { id: 'theme', label: 'Theme', hint: 'Site colors and typography' },
  { id: 'project_settings', label: 'Project settings', hint: 'Backups and metadata' },
  { id: 'users', label: 'User management', hint: 'Team members and roles' },
  { id: 'system', label: 'System & audit', hint: 'Platform activity logs' },
]);

const ALL_WRITE = {
  builder: PERM.WRITE,
  publishing: PERM.WRITE,
  media: PERM.WRITE,
  cms: PERM.WRITE,
  seo: PERM.WRITE,
  domains: PERM.MANAGE,
  theme: PERM.WRITE,
  project_settings: PERM.MANAGE,
  users: PERM.NONE,
  system: PERM.READ,
};

const ALL_READ = {
  builder: PERM.READ,
  publishing: PERM.READ,
  media: PERM.READ,
  cms: PERM.READ,
  seo: PERM.READ,
  domains: PERM.READ,
  theme: PERM.READ,
  project_settings: PERM.READ,
  users: PERM.NONE,
  system: PERM.NONE,
};

export const ROLE_DEFINITIONS = Object.freeze([
  {
    id: ROLES.SUPER_ADMIN,
    label: 'Super admin',
    icon: 'S',
    rank: ROLE_RANK.super_admin,
    summary: 'Full platform access across every project.',
    description:
      'Bootstrap role with unrestricted access. Can manage all projects, users, domains, and platform settings without project assignment.',
    projectScope: 'All projects — no assignment required',
    permissions: {
      builder: PERM.FULL,
      publishing: PERM.FULL,
      media: PERM.FULL,
      cms: PERM.FULL,
      seo: PERM.FULL,
      domains: PERM.FULL,
      theme: PERM.FULL,
      project_settings: PERM.FULL,
      users: PERM.FULL,
      system: PERM.FULL,
    },
  },
  {
    id: ROLES.ADMIN,
    label: 'Admin',
    icon: 'A',
    rank: ROLE_RANK.admin,
    summary: 'Manage assigned projects and team members.',
    description:
      'Project managers who can publish, configure domains, and invite editors. User management excludes super admins.',
    projectScope: 'Assigned projects only',
    permissions: {
      ...ALL_WRITE,
      users: PERM.MANAGE,
      system: PERM.READ,
    },
  },
  {
    id: ROLES.EDITOR,
    label: 'Editor',
    icon: 'E',
    rank: ROLE_RANK.editor,
    summary: 'Build and publish within assigned projects.',
    description:
      'Content team role for builder, CMS, media, SEO, and publishing. Cannot manage domains or other users.',
    projectScope: 'Assigned projects only',
    permissions: {
      ...ALL_WRITE,
      domains: PERM.READ,
      project_settings: PERM.READ,
      users: PERM.NONE,
      system: PERM.NONE,
    },
  },
  {
    id: ROLES.VIEWER,
    label: 'Viewer',
    icon: 'V',
    rank: ROLE_RANK.viewer,
    summary: 'Read-only access for review and analytics.',
    description:
      'Stakeholders who can preview workspace data without editing. Ideal for clients or QA reviewers.',
    projectScope: 'Assigned projects only',
    permissions: ALL_READ,
  },
]);

export function getRoleDefinition(roleId) {
  return ROLE_DEFINITIONS.find((r) => r.id === roleId) || null;
}

export function permissionLabel(level) {
  return PERM_LABELS[level] || PERM_LABELS[PERM.NONE];
}
