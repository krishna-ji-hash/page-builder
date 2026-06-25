import { MenuLocation, type Menu, type MenuItem, type Page } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publicPagePath } from '@/lib/publicSiteUrls';
import {
  AdminMenuValidationError,
  parseMenuId,
  parseMenuItemId,
  parseOptionalPageId,
  parseOptionalParentId,
  parseProjectId,
  validateMenuItemLabel,
  validateMenuItemTarget,
  validateMenuItemUrl,
  validateMenuLocation,
  validateMenuName,
  validateSortOrder,
} from '@/lib/admin/adminMenuInput';

export type SerializedMenuItem = {
  id: number;
  menuId: number;
  label: string;
  url: string;
  pageId: number | null;
  pageSlug: string | null;
  pageTitle: string | null;
  target: string;
  sortOrder: number;
  parentId: number | null;
  children: SerializedMenuItem[];
};

export type SerializedMenu = {
  id: number;
  projectId: number;
  name: string;
  location: MenuLocation;
  createdAt: Date;
  updatedAt: Date;
  items: SerializedMenuItem[];
};

type MenuItemRow = MenuItem & {
  page: Pick<Page, 'id' | 'slug' | 'title'> | null;
};

function serializeMenuItemTree(rows: MenuItemRow[]): SerializedMenuItem[] {
  const byParent = new Map<string, MenuItemRow[]>();
  for (const row of rows) {
    const key = row.parentId ? String(row.parentId) : 'root';
    const list = byParent.get(key) || [];
    list.push(row);
    byParent.set(key, list);
  }

  const build = (parentKey: string): SerializedMenuItem[] => {
    const list = (byParent.get(parentKey) || []).sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    return list.map((row) => ({
      id: Number(row.id),
      menuId: Number(row.menuId),
      label: row.label,
      url: row.url,
      pageId: row.pageId ? Number(row.pageId) : null,
      pageSlug: row.page?.slug ?? null,
      pageTitle: row.page?.title ?? null,
      target: row.target,
      sortOrder: row.sortOrder,
      parentId: row.parentId ? Number(row.parentId) : null,
      children: build(String(row.id)),
    }));
  };

  return build('root');
}

function serializeMenu(menu: Menu, items: SerializedMenuItem[]): SerializedMenu {
  return {
    id: Number(menu.id),
    projectId: Number(menu.projectId),
    name: menu.name,
    location: menu.location,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    items,
  };
}

async function loadMenuItems(menuId: bigint) {
  const rows = await prisma.menuItem.findMany({
    where: { menuId },
    include: {
      page: { select: { id: true, slug: true, title: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return serializeMenuItemTree(rows);
}

async function getMenuOrThrow(menuId: bigint) {
  const menu = await prisma.menu.findUnique({ where: { id: menuId } });
  if (!menu) throw new AdminMenuValidationError('Menu not found', 'NOT_FOUND');
  return menu;
}

async function assertPageInProject(pageId: bigint | null, projectId: bigint) {
  if (pageId == null) return;
  const page = await prisma.page.findFirst({
    where: { id: pageId, projectId },
    select: { id: true },
  });
  if (!page) throw new AdminMenuValidationError('Linked page not found in this project');
}

async function assertParentInMenu(parentId: bigint | null, menuId: bigint) {
  if (parentId == null) return;
  const parent = await prisma.menuItem.findFirst({
    where: { id: parentId, menuId },
    select: { id: true },
  });
  if (!parent) throw new AdminMenuValidationError('Parent menu item not found in this menu');
}

export async function listAdminProjectMenus(projectIdRaw: string): Promise<SerializedMenu[]> {
  const projectId = parseProjectId(projectIdRaw);
  const menus = await prisma.menu.findMany({
    where: { projectId },
    orderBy: [{ location: 'asc' }, { updatedAt: 'desc' }, { id: 'asc' }],
  });

  const result: SerializedMenu[] = [];
  for (const menu of menus) {
    const items = await loadMenuItems(menu.id);
    result.push(serializeMenu(menu, items));
  }
  return result;
}

export async function createAdminProjectMenu(
  projectIdRaw: string,
  input: { name?: unknown; location?: unknown }
) {
  const projectId = parseProjectId(projectIdRaw);
  const name = validateMenuName(input.name);
  const location = validateMenuLocation(input.location);

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new AdminMenuValidationError('Project not found', 'NOT_FOUND');

  const menu = await prisma.menu.create({
    data: { projectId, name, location },
  });
  return serializeMenu(menu, []);
}

export async function updateAdminMenu(
  menuIdRaw: string,
  input: { name?: unknown; location?: unknown }
) {
  const menuId = parseMenuId(menuIdRaw);
  await getMenuOrThrow(menuId);

  const data: { name?: string; location?: MenuLocation } = {};
  if (input.name !== undefined) data.name = validateMenuName(input.name);
  if (input.location !== undefined) data.location = validateMenuLocation(input.location);
  if (!Object.keys(data).length) {
    throw new AdminMenuValidationError('No valid fields to update');
  }

  const menu = await prisma.menu.update({ where: { id: menuId }, data });
  const items = await loadMenuItems(menu.id);
  return serializeMenu(menu, items);
}

export async function deleteAdminMenu(menuIdRaw: string) {
  const menuId = parseMenuId(menuIdRaw);
  await getMenuOrThrow(menuId);
  await prisma.menu.delete({ where: { id: menuId } });
  return { deleted: true, menuId: Number(menuId) };
}

export async function createAdminMenuItem(
  menuIdRaw: string,
  input: {
    label?: unknown;
    url?: unknown;
    pageId?: unknown;
    target?: unknown;
    sortOrder?: unknown;
    parentId?: unknown;
  }
) {
  const menuId = parseMenuId(menuIdRaw);
  const menu = await getMenuOrThrow(menuId);
  const label = validateMenuItemLabel(input.label);
  const url = validateMenuItemUrl(input.url);
  const pageId = parseOptionalPageId(input.pageId);
  const parentId = parseOptionalParentId(input.parentId);
  const target = validateMenuItemTarget(input.target);
  const sortOrder = validateSortOrder(input.sortOrder);

  await assertPageInProject(pageId, menu.projectId);
  await assertParentInMenu(parentId, menuId);

  const item = await prisma.menuItem.create({
    data: {
      menuId,
      label,
      url,
      pageId,
      parentId,
      target,
      sortOrder,
    },
  });

  return {
    item: {
      id: Number(item.id),
      menuId: Number(item.menuId),
      label: item.label,
      url: item.url,
      pageId: item.pageId ? Number(item.pageId) : null,
      target: item.target,
      sortOrder: item.sortOrder,
      parentId: item.parentId ? Number(item.parentId) : null,
      children: [],
    },
  };
}

export async function updateAdminMenuItem(
  itemIdRaw: string,
  input: {
    label?: unknown;
    url?: unknown;
    pageId?: unknown;
    target?: unknown;
    sortOrder?: unknown;
    parentId?: unknown;
  }
) {
  const itemId = parseMenuItemId(itemIdRaw);
  const existing = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { menu: { select: { id: true, projectId: true } } },
  });
  if (!existing) throw new AdminMenuValidationError('Menu item not found', 'NOT_FOUND');

  const data: {
    label?: string;
    url?: string;
    pageId?: bigint | null;
    target?: string;
    sortOrder?: number;
    parentId?: bigint | null;
  } = {};

  if (input.label !== undefined) data.label = validateMenuItemLabel(input.label);
  if (input.url !== undefined) data.url = validateMenuItemUrl(input.url);
  if (input.pageId !== undefined) data.pageId = parseOptionalPageId(input.pageId);
  if (input.target !== undefined) data.target = validateMenuItemTarget(input.target);
  if (input.sortOrder !== undefined) data.sortOrder = validateSortOrder(input.sortOrder);
  if (input.parentId !== undefined) {
    const parentId = parseOptionalParentId(input.parentId);
    if (parentId != null && parentId === itemId) {
      throw new AdminMenuValidationError('Menu item cannot be its own parent');
    }
    data.parentId = parentId;
  }

  if (!Object.keys(data).length) {
    throw new AdminMenuValidationError('No valid fields to update');
  }

  if (data.pageId !== undefined) {
    await assertPageInProject(data.pageId, existing.menu.projectId);
  }
  if (data.parentId !== undefined) {
    await assertParentInMenu(data.parentId, existing.menu.id);
  }

  const item = await prisma.menuItem.update({ where: { id: itemId }, data });
  return {
    item: {
      id: Number(item.id),
      menuId: Number(item.menuId),
      label: item.label,
      url: item.url,
      pageId: item.pageId ? Number(item.pageId) : null,
      target: item.target,
      sortOrder: item.sortOrder,
      parentId: item.parentId ? Number(item.parentId) : null,
    },
  };
}

export async function deleteAdminMenuItem(itemIdRaw: string) {
  const itemId = parseMenuItemId(itemIdRaw);
  const existing = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!existing) throw new AdminMenuValidationError('Menu item not found', 'NOT_FOUND');
  await prisma.menuItem.delete({ where: { id: itemId } });
  return { deleted: true, itemId: Number(itemId) };
}

export type PublicProjectMenus = {
  HEADER: Array<{ label: string; to: string; target?: string; children?: unknown[] }>;
  FOOTER: Array<{ label: string; to: string; target?: string; children?: unknown[] }>;
};

export async function resolveMenuProjectId(menuIdRaw: string): Promise<string | null> {
  try {
    const menuId = parseMenuId(menuIdRaw);
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { projectId: true },
    });
    return menu ? String(menu.projectId) : null;
  } catch {
    return null;
  }
}

export async function resolveMenuItemProjectId(itemIdRaw: string): Promise<string | null> {
  try {
    const itemId = parseMenuItemId(itemIdRaw);
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { menu: { select: { projectId: true } } },
    });
    return item?.menu?.projectId != null ? String(item.menu.projectId) : null;
  } catch {
    return null;
  }
}

function runtimeItemsFromSerialized(items: SerializedMenuItem[], pageSlugById: Map<number, string>, projectSlug: string) {
  const mapNode = (item: SerializedMenuItem) => {
    let to = item.url?.trim() || '#';
    if (item.pageId && pageSlugById.has(item.pageId)) {
      to = publicPagePath(projectSlug, pageSlugById.get(item.pageId)!, { publicSite: true });
    }
    return {
      label: item.label,
      to,
      target: item.target === '_blank' ? '_blank' : undefined,
      children: (item.children || []).map(mapNode),
    };
  };
  return items.map(mapNode);
}

export async function getPublicProjectMenus(projectId: bigint, projectSlug: string): Promise<PublicProjectMenus> {
  const menus = await listAdminProjectMenus(String(projectId));
  const pages = await prisma.page.findMany({
    where: { projectId },
    select: { id: true, slug: true },
  });
  const pageSlugById = new Map(pages.map((p) => [Number(p.id), p.slug]));

  const byLocation: PublicProjectMenus = { HEADER: [], FOOTER: [] };
  const seen = new Set<string>();

  for (const menu of menus) {
    const key = menu.location;
    if (seen.has(key)) continue;
    seen.add(key);
    byLocation[key] = runtimeItemsFromSerialized(menu.items, pageSlugById, projectSlug);
  }

  return byLocation;
}
