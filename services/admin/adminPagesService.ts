import { PageStatus, PageVersionSource, type Page, type Prisma, type Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminProjectValidationError, parseProjectId } from '@/lib/admin/adminProjectInput';
import {
  AdminPageValidationError,
  parsePageId,
  validateDraftContent,
  validatePageSeoInput,
  validatePageSlug,
  validatePageTitle,
} from '@/lib/admin/adminPageInput';
import { buildDefaultStarterPageJson } from '@/lib/site/defaultStarterPageJson';
import { createAdminPageVersion } from '@/services/admin/adminPageVersionService';

export type SerializedAdminPage = {
  id: number;
  projectId: number;
  title: string;
  slug: string;
  status: PageStatus;
  draftJson: unknown;
  publishedJson: unknown;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedAdminProjectRef = {
  id: number;
  name: string;
  slug: string;
  homeSlug: string;
  domain: string | null;
};

const adminPageSelect = {
  id: true,
  projectId: true,
  title: true,
  slug: true,
  status: true,
  draftJson: true,
  publishedJson: true,
  publishedAt: true,
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

function serializePage(
  page: Pick<
    Page,
    | 'id'
    | 'projectId'
    | 'title'
    | 'slug'
    | 'status'
    | 'draftJson'
    | 'publishedJson'
    | 'publishedAt'
    | 'seoTitle'
    | 'seoDescription'
    | 'seoKeywords'
    | 'ogImage'
    | 'robotsIndex'
    | 'robotsFollow'
    | 'canonicalUrl'
    | 'createdAt'
    | 'updatedAt'
  >
): SerializedAdminPage {
  return {
    id: Number(page.id),
    projectId: Number(page.projectId),
    title: page.title,
    slug: page.slug,
    status: page.status,
    draftJson: page.draftJson,
    publishedJson: page.publishedJson,
    publishedAt: page.publishedAt,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    ogImage: page.ogImage,
    robotsIndex: page.robotsIndex,
    robotsFollow: page.robotsFollow,
    canonicalUrl: page.canonicalUrl,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

function serializeProjectRef(project: Pick<Project, 'id' | 'name' | 'slug' | 'homeSlug' | 'domain'>): SerializedAdminProjectRef {
  return {
    id: Number(project.id),
    name: project.name,
    slug: project.slug,
    homeSlug: project.homeSlug,
    domain: project.domain,
  };
}

async function getProjectOrThrow(projectId: bigint) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AdminProjectValidationError('Project not found');
  }
  return project;
}

async function getPageWithProjectOrThrow(pageId: bigint) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      ...adminPageSelect,
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          homeSlug: true,
          domain: true,
        },
      },
    },
  });
  if (!page) {
    throw new AdminPageValidationError('Page not found');
  }
  return page;
}

async function assertPageSlugAvailable(projectId: bigint, slug: string, excludePageId?: bigint) {
  const existing = await prisma.page.findFirst({
    where: {
      projectId,
      slug,
      ...(excludePageId != null ? { NOT: { id: excludePageId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new AdminPageValidationError(`Page slug "${slug}" already exists in this project`, 'CONFLICT');
  }
}

export async function resolvePageProjectId(pageIdRaw: string): Promise<number | null> {
  const raw = String(pageIdRaw ?? '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const row = await prisma.page.findUnique({
    where: { id: BigInt(raw) },
    select: { projectId: true },
  });
  return row ? Number(row.projectId) : null;
}

export async function listAdminProjectPages(projectIdRaw: string) {
  const projectId = parseProjectId(projectIdRaw);
  await getProjectOrThrow(projectId);

  const pages = await prisma.page.findMany({
    where: { projectId },
    select: adminPageSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return pages.map(serializePage);
}

export async function createAdminProjectPage(
  projectIdRaw: string,
  input: { title?: unknown; slug?: unknown }
) {
  const projectId = parseProjectId(projectIdRaw);
  const project = await getProjectOrThrow(projectId);

  const title = validatePageTitle(input.title);
  const slug = validatePageSlug(input.slug);
  await assertPageSlugAvailable(projectId, slug);

  const draftJson = buildDefaultStarterPageJson(title);

  const page = await prisma.page.create({
    data: {
      projectId,
      title,
      slug,
      status: PageStatus.draft,
      draftJson,
      publishedJson: null,
      publishedAt: null,
    },
    select: adminPageSelect,
  });

  return {
    page: serializePage(page),
    project: serializeProjectRef(project),
  };
}

export async function getAdminPage(pageIdRaw: string) {
  const pageId = parsePageId(pageIdRaw);
  const row = await getPageWithProjectOrThrow(pageId);
  const { project, ...pageFields } = row;
  return {
    page: serializePage(pageFields),
    project: serializeProjectRef(project),
  };
}

export async function updateAdminPageDraft(
  pageIdRaw: string,
  input: { content?: unknown; createRevision?: boolean; createdById?: bigint | null }
) {
  const pageId = parsePageId(pageIdRaw);
  await getPageWithProjectOrThrow(pageId);

  const draftJson = validateDraftContent(input.content) as Prisma.InputJsonValue;

  const page = await prisma.page.update({
    where: { id: pageId },
    data: { draftJson },
    select: adminPageSelect,
  });

  if (input.createRevision) {
    await createAdminPageVersion(
      pageId,
      draftJson,
      PageVersionSource.DRAFT_SAVE,
      input.createdById ?? null
    );
  }

  return serializePage(page);
}

export async function publishAdminPage(pageIdRaw: string, createdById?: bigint | null) {
  const pageId = parsePageId(pageIdRaw);
  const existing = await getPageWithProjectOrThrow(pageId);

  if (existing.draftJson == null) {
    throw new AdminPageValidationError('Cannot publish — draftJson is empty');
  }

  const now = new Date();
  const draftJson = existing.draftJson as Prisma.InputJsonValue;
  const page = await prisma.page.update({
    where: { id: pageId },
    data: {
      publishedJson: draftJson,
      status: PageStatus.published,
      publishedAt: now,
    },
    select: adminPageSelect,
  });

  await createAdminPageVersion(pageId, draftJson, PageVersionSource.PUBLISH, createdById ?? null, {
    force: true,
  });

  return serializePage(page);
}

export async function updateAdminPage(
  pageIdRaw: string,
  input: {
    title?: unknown;
    slug?: unknown;
    seoTitle?: unknown;
    seoDescription?: unknown;
    seoKeywords?: unknown;
    ogImage?: unknown;
    robotsIndex?: unknown;
    robotsFollow?: unknown;
    canonicalUrl?: unknown;
  }
) {
  const pageId = parsePageId(pageIdRaw);
  const existing = await getPageWithProjectOrThrow(pageId);

  const data: {
    title?: string;
    slug?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    ogImage?: string | null;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    canonicalUrl?: string | null;
  } = {};

  if (input.title !== undefined) {
    data.title = validatePageTitle(input.title);
  }

  if (input.slug !== undefined) {
    const slug = validatePageSlug(input.slug);
    await assertPageSlugAvailable(existing.projectId, slug, pageId);
    data.slug = slug;
  }

  Object.assign(data, validatePageSeoInput(input));

  if (!Object.keys(data).length) {
    throw new AdminPageValidationError('No valid fields to update');
  }

  const page = await prisma.page.update({
    where: { id: pageId },
    data,
    select: adminPageSelect,
  });

  return serializePage(page);
}

export async function deleteAdminPage(pageIdRaw: string) {
  const pageId = parsePageId(pageIdRaw);
  const existing = await getPageWithProjectOrThrow(pageId);

  if (existing.slug === existing.project.homeSlug) {
    throw new AdminPageValidationError(
      'Cannot delete the project home page. Set project homeSlug to another page first.'
    );
  }

  await prisma.page.delete({ where: { id: pageId } });

  return { deleted: true, pageId: Number(pageId) };
}
