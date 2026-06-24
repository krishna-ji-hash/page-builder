import { PageStatus, ProjectStatus, type Page, type Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SITE_SETTING_ID = 'main';

export type PublishedPageRequestParams = {
  host: string;
  slugParts?: string[];
};

/** Public page row — never includes `draftJson`. */
export type PublicPublishedPage = Omit<Page, 'draftJson'>;

export type PublishedPageRequestResult = {
  project: Project;
  page: PublicPublishedPage;
};

/**
 * Normalize a Host header or URL hostname for domain matching.
 * - Strips protocol, path, query, and hash if present
 * - Removes leading `www.` (production-style hosts)
 * - Removes port (e.g. `example.com:443` → `example.com`, `localhost:3000` → `localhost`)
 */
export function normalizeHost(host: string): string {
  let value = String(host || '').trim().toLowerCase();
  if (!value) return '';

  value = value.replace(/^https?:\/\//, '');
  value = value.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';

  // IPv6 host from URL / bracketed form: `[::1]:3000`
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end !== -1) {
      value = value.slice(1, end);
    }
  } else if (value.includes(':')) {
    value = value.split(':')[0] ?? value;
  }

  if (value.startsWith('www.') && !isLocalHostName(value.slice(4))) {
    value = value.slice(4);
  }

  return value;
}

export function isLocalHostName(host: string): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
  return false;
}

/**
 * Resolve an ACTIVE project for a request host.
 * 1. `projects.domain` exact match
 * 2. `localhost` / `127.0.0.1` → `site_settings.activeProjectId`
 */
export async function getProjectByHost(host: string): Promise<Project | null> {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;

  const byDomain = await prisma.project.findFirst({
    where: {
      domain: normalizedHost,
      status: ProjectStatus.ACTIVE,
    },
  });
  if (byDomain) return byDomain;

  const domainRows = await prisma.$queryRaw<{ project_id: bigint }[]>`
    SELECT pd.project_id
    FROM project_domains pd
    INNER JOIN projects pr ON pr.id = pd.project_id
    WHERE pd.domain = ${normalizedHost}
      AND pd.verified = 1
      AND pr.status = 'ACTIVE'
    LIMIT 1
  `;
  const mappedProjectId = domainRows[0]?.project_id;
  if (mappedProjectId) {
    const byMappedDomain = await prisma.project.findFirst({
      where: { id: mappedProjectId, status: ProjectStatus.ACTIVE },
    });
    if (byMappedDomain) return byMappedDomain;
  }

  if (!isLocalHostName(normalizedHost)) return null;

  const settings = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { activeProjectId: true },
  });
  if (!settings?.activeProjectId) return null;

  return prisma.project.findFirst({
    where: {
      id: settings.activeProjectId,
      status: ProjectStatus.ACTIVE,
    },
  });
}

const PUBLIC_PAGE_SELECT = {
  id: true,
  projectId: true,
  title: true,
  slug: true,
  status: true,
  publishedJson: true,
  publishedAt: true,
  publishedVersionId: true,
  seoJson: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImage: true,
  robotsIndex: true,
  robotsFollow: true,
  canonicalUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Resolve a published public page for a host + path segments.
 * Public routes only — never reads or returns `draftJson`.
 */
export async function getPublishedPageForRequest(
  params: PublishedPageRequestParams
): Promise<PublishedPageRequestResult | null> {
  const project = await getProjectByHost(params.host);
  if (!project) return null;

  const slugParts = (params.slugParts ?? []).map((s) => String(s).trim()).filter(Boolean);
  const pageSlug = slugParts.length === 0 ? project.homeSlug : slugParts.join('/');

  const page = await prisma.page.findFirst({
    where: {
      projectId: project.id,
      slug: pageSlug,
      status: PageStatus.published,
      publishedJson: { not: null },
    },
    select: PUBLIC_PAGE_SELECT,
  });

  if (!page) return null;
  return { project, page };
}
