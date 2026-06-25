import {
  PageStatus,
  ProjectDomainStatus,
  ProjectStatus,
  ProjectType,
  type Page,
  type Project,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { syncPrimaryDomainRecord } from '@/services/admin/adminDomainMapService';
import {
  AdminProjectValidationError,
  normalizeProjectDomain,
  parseProjectId,
  validateHomeSlug,
  validateOptionalDomain,
  validateProjectName,
  validateProjectSlug,
  validateProjectStatus,
} from '@/lib/admin/adminProjectInput';
import { buildDefaultStarterPageJson } from '@/lib/site/defaultStarterPageJson';
import { deleteProjectSafely } from '@/services/builder/builderService';

const SITE_SETTING_ID = 'main';
const DEFAULT_HOME_SLUG = 'home';

export type SerializedProject = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  domainStatus: ProjectDomainStatus;
  lastVerifiedAt: Date | null;
  homeSlug: string;
  status: ProjectStatus;
  title: string | null;
  type: ProjectType;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedPage = {
  id: number;
  projectId: number;
  title: string;
  slug: string;
  status: PageStatus;
  publishedJson: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeProject(project: Project): SerializedProject {
  return {
    id: Number(project.id),
    name: project.name,
    slug: project.slug,
    domain: project.domain,
    domainStatus: project.domainStatus,
    lastVerifiedAt: project.lastVerifiedAt,
    homeSlug: project.homeSlug,
    status: project.status,
    title: project.title,
    type: project.type,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function serializePage(page: Pick<Page, 'id' | 'projectId' | 'title' | 'slug' | 'status' | 'publishedJson' | 'publishedAt' | 'createdAt' | 'updatedAt'>): SerializedPage {
  return {
    id: Number(page.id),
    projectId: Number(page.projectId),
    title: page.title,
    slug: page.slug,
    status: page.status,
    publishedJson: page.publishedJson,
    publishedAt: page.publishedAt,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

async function assertDomainAvailable(domain: string | null, excludeProjectId?: bigint) {
  if (!domain) return;
  const existing = await prisma.project.findFirst({
    where: {
      domain,
      ...(excludeProjectId != null ? { NOT: { id: excludeProjectId } } : {}),
    },
    select: { id: true, slug: true },
  });
  if (existing) {
    throw new AdminProjectValidationError(`Domain "${domain}" is already assigned to another project`, 'CONFLICT');
  }
}

async function assertSlugAvailable(slug: string, excludeProjectId?: bigint) {
  const existing = await prisma.project.findFirst({
    where: {
      slug,
      ...(excludeProjectId != null ? { NOT: { id: excludeProjectId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new AdminProjectValidationError(`Project slug "${slug}" already exists`, 'CONFLICT');
  }
}

export async function listAdminProjects(): Promise<SerializedProject[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return projects.map(serializeProject);
}

export async function createAdminProject(input: {
  name?: unknown;
  slug?: unknown;
  domain?: unknown;
}) {
  const name = validateProjectName(input.name);
  const slug = validateProjectSlug(input.slug);
  const domain = validateOptionalDomain(input.domain);

  await assertSlugAvailable(slug);
  await assertDomainAvailable(domain);

  const starterJson = buildDefaultStarterPageJson(name);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        title: name,
        slug,
        domain,
        homeSlug: DEFAULT_HOME_SLUG,
        status: ProjectStatus.ACTIVE,
        type: ProjectType.website,
        configJson: { siteTheme: { mode: 'light' } },
      },
    });

    const homePage = await tx.page.create({
      data: {
        projectId: project.id,
        title: 'Home',
        slug: DEFAULT_HOME_SLUG,
        status: PageStatus.published,
        draftJson: starterJson,
        publishedJson: starterJson,
        publishedAt: now,
      },
    });

    return { project, homePage };
  });

  if (domain) {
    await syncPrimaryDomainRecord(result.project.id, domain);
  }

  return {
    project: serializeProject(result.project),
    homePage: serializePage(result.homePage),
  };
}

export async function updateAdminProject(
  projectIdRaw: string,
  input: {
    name?: unknown;
    slug?: unknown;
    domain?: unknown;
    status?: unknown;
    homeSlug?: unknown;
  }
) {
  const projectId = parseProjectId(projectIdRaw);
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AdminProjectValidationError('Project not found');
  }

  const data: {
    name?: string;
    title?: string;
    slug?: string;
    domain?: string | null;
    domainStatus?: ProjectDomainStatus;
    lastVerifiedAt?: Date | null;
    status?: ProjectStatus;
    homeSlug?: string;
  } = {};

  if (input.name !== undefined) {
    const name = validateProjectName(input.name);
    data.name = name;
    data.title = name;
  }

  if (input.slug !== undefined) {
    const slug = validateProjectSlug(input.slug);
    await assertSlugAvailable(slug, projectId);
    data.slug = slug;
  }

  if (input.domain !== undefined) {
    const domain =
      input.domain == null || input.domain === ''
        ? null
        : validateOptionalDomain(input.domain);
    await assertDomainAvailable(domain, projectId);
    if (domain !== existing.domain) {
      data.domain = domain;
      data.domainStatus = ProjectDomainStatus.PENDING;
      data.lastVerifiedAt = null;
    }
  }

  if (input.status !== undefined) {
    const status = validateProjectStatus(input.status);
    if (status) data.status = status;
  }

  if (input.homeSlug !== undefined) {
    const homeSlug = validateHomeSlug(input.homeSlug);
    if (homeSlug) data.homeSlug = homeSlug;
  }

  if (!Object.keys(data).length) {
    throw new AdminProjectValidationError('No valid fields to update');
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  if (input.domain !== undefined) {
    await syncPrimaryDomainRecord(projectId, project.domain);
  }

  return serializeProject(project);
}

export async function archiveAdminProject(projectIdRaw: string) {
  const projectId = parseProjectId(projectIdRaw);
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AdminProjectValidationError('Project not found');
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: ProjectStatus.ARCHIVED },
  });

  return serializeProject(project);
}

/** Permanently remove an archived project and all related data from the database. */
export async function deleteAdminProjectPermanently(projectIdRaw: string) {
  const projectId = parseProjectId(projectIdRaw);
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AdminProjectValidationError('Project not found');
  }
  if (existing.status !== ProjectStatus.ARCHIVED) {
    throw new AdminProjectValidationError(
      'Only archived projects can be permanently deleted. Archive the project first.'
    );
  }

  await prisma.siteSetting.updateMany({
    where: { activeProjectId: projectId },
    data: { activeProjectId: null },
  });

  const result = await deleteProjectSafely(Number(projectId));
  if (!result) {
    throw new AdminProjectValidationError('Project not found');
  }

  return {
    id: Number(projectId),
    deleted: true,
    name: existing.name,
    slug: existing.slug,
  };
}

export async function setActiveAdminProject(projectIdRaw: string) {
  const projectId = parseProjectId(projectIdRaw);
  const project = await prisma.project.findFirst({
    where: { id: projectId, status: ProjectStatus.ACTIVE },
  });
  if (!project) {
    throw new AdminProjectValidationError('Active project not found');
  }

  const settings = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, activeProjectId: projectId },
    update: { activeProjectId: projectId },
  });

  return {
    settings: {
      id: settings.id,
      activeProjectId: settings.activeProjectId ? Number(settings.activeProjectId) : null,
    },
    project: serializeProject(project),
  };
}

export { normalizeProjectDomain, serializeProject };
