import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
  ADMIN_PUBLISHING_PATH,
  PROJECT_SECTIONS,
  SETTINGS_SECTIONS,
  adminProjectSectionPath,
} from './adminRoutes.js';
import { adminBuilderPagePath } from '../builder/adminBuilderRoutes.js';

const PLATFORM_ENTRIES = [
  { id: 'nav-dashboard', label: 'Dashboard', category: 'Platform', href: ADMIN_DASHBOARD_PATH, keywords: ['home', 'overview', 'stats'] },
  { id: 'nav-projects', label: 'All projects', category: 'Platform', href: ADMIN_PROJECTS_PATH, keywords: ['sites', 'projects'] },
  { id: 'nav-new-project', label: 'New project', category: 'Platform', href: ADMIN_PROJECT_NEW_PATH, keywords: ['create', 'site'] },
  { id: 'nav-publishing', label: 'Publishing', category: 'Platform', href: ADMIN_PUBLISHING_PATH, keywords: ['publish', 'live', 'draft'] },
  { id: 'nav-health', label: 'Platform health', category: 'Platform', href: ADMIN_PLATFORM_HEALTH_PATH, keywords: ['audit', 'health', 'system'] },
  ...SETTINGS_SECTIONS.map((s) => ({
    id: `nav-settings-${s.id}`,
    label: s.label,
    category: 'Settings',
    href: s.href,
    keywords: ['settings', s.id],
  })),
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function buildAdminSearchIndex({ projects = [], pages = [] } = {}) {
  const entries = [...PLATFORM_ENTRIES];

  for (const project of projects) {
    const name = project.name || project.slug || `Project ${project.id}`;
    const slug = project.slug || '';
    entries.push({
      id: `project-${project.id}`,
      label: name,
      category: 'Project',
      href: adminProjectSectionPath(project, 'overview'),
      keywords: [slug, String(project.id), project.type || 'website'],
      meta: slug ? `/${slug}` : null,
    });

    for (const section of PROJECT_SECTIONS) {
      entries.push({
        id: `project-${project.id}-${section.id}`,
        label: `${name} — ${section.label}`,
        category: 'Workspace',
        href: adminProjectSectionPath(project, section.id),
        keywords: [name, slug, section.id, section.label],
        meta: section.label,
      });
    }
  }

  for (const page of pages) {
    const title = page.title || page.slug || 'Page';
    const projectSlug = page.projectSlug || '';
    const projectName = page.projectName || projectSlug;
    entries.push({
      id: `page-${page.id}`,
      label: title,
      category: 'Page',
      href: adminBuilderPagePath(projectSlug, page.slug),
      keywords: [title, page.slug, projectSlug, projectName, page.status],
      meta: `${projectName} · ${page.status || 'draft'}`,
    });
    if (page.projectId) {
      entries.push({
        id: `page-mgmt-${page.id}`,
        label: `${title} — manage pages`,
        category: 'Page',
        href: adminProjectSectionPath(page.projectSlug || page.projectId, 'pages'),
        keywords: [title, page.slug, projectSlug, 'manage', 'pages'],
        meta: projectName,
      });
    }
  }

  return entries;
}

export function searchAdminIndex(entries, query, limit = 12) {
  const q = normalize(query);
  if (!q) return [];

  const scored = [];
  for (const entry of entries) {
    const label = normalize(entry.label);
    const category = normalize(entry.category);
    const meta = normalize(entry.meta);
    const keywords = (entry.keywords || []).map(normalize);

    let score = 0;
    if (label === q) score += 100;
    else if (label.startsWith(q)) score += 80;
    else if (label.includes(q)) score += 60;

    if (keywords.some((k) => k === q)) score += 70;
    else if (keywords.some((k) => k.startsWith(q))) score += 50;
    else if (keywords.some((k) => k.includes(q))) score += 30;

    if (category.includes(q)) score += 20;
    if (meta.includes(q)) score += 15;

    if (score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.entry);
}
