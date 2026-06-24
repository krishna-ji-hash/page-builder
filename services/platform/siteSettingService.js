import { prisma } from '@/lib/prisma';

const MAIN_ID = 'main';

export async function getSiteSettings() {
  let row = await prisma.siteSetting.findUnique({ where: { id: MAIN_ID } });
  if (!row) {
    row = await prisma.siteSetting.create({ data: { id: MAIN_ID } });
  }
  return row;
}

export async function getActiveProject() {
  const settings = await getSiteSettings();
  if (!settings.activeProjectId) return null;
  return prisma.project.findFirst({
    where: { id: settings.activeProjectId, status: 'ACTIVE' },
  });
}

export async function getActiveProjectSlug() {
  const project = await getActiveProject();
  return project?.slug || null;
}

export async function setActiveProjectId(projectId) {
  const pid = projectId == null ? null : BigInt(projectId);
  if (pid != null) {
    const project = await prisma.project.findFirst({
      where: { id: pid, status: 'ACTIVE' },
    });
    if (!project) throw new Error('Active project not found or archived');
  }
  return prisma.siteSetting.upsert({
    where: { id: MAIN_ID },
    create: { id: MAIN_ID, activeProjectId: pid },
    update: { activeProjectId: pid },
  });
}

/**
 * Resolve project by custom domain (`projects.domain` column).
 * @param {string} host normalized hostname
 */
export async function resolveProjectByDomain(host) {
  if (!host) return null;
  return prisma.project.findFirst({
    where: { domain: host, status: 'ACTIVE' },
    select: { id: true, slug: true, homeSlug: true, domain: true, name: true },
  });
}

/**
 * Published home page JSON for a domain-mapped project.
 */
export async function getPublishedHomePageForDomain(host) {
  const project = await resolveProjectByDomain(host);
  if (!project) return null;
  const page = await prisma.page.findFirst({    where: {
      projectId: project.id,
      slug: project.homeSlug,
      status: 'published',
      publishedJson: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedJson: true,
      publishedAt: true,
      seoJson: true,
    },
  });
  if (!page) return null;
  return { project, page };
}
