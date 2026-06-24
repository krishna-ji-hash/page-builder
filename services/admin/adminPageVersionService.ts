import { PageVersionSource, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { flattenTemplateToBulkNodes } from '@/lib/sectionTemplates';
import { autoFixTree, validateTree } from '@/lib/builderTree';
import { AdminPageValidationError, parsePageId } from '@/lib/admin/adminPageInput';
import { createNodesBulk, getBuilderState } from '@/services/builder/builderService';

export type SerializedAdminPageVersion = {
  id: number;
  pageId: number;
  versionNumber: number;
  source: PageVersionSource;
  createdAt: Date;
  createdById: number | null;
  createdByName: string | null;
  isLive: boolean;
};

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return '';
  }
}

async function getNextVersionNumber(pageId: bigint, tx: Prisma.TransactionClient = prisma) {
  const agg = await tx.pageVersion.aggregate({
    where: { pageId },
    _max: { versionNumber: true },
  });
  return (agg._max.versionNumber ?? 0) + 1;
}

export async function createAdminPageVersion(
  pageId: bigint,
  snapshotJson: Prisma.InputJsonValue,
  source: PageVersionSource,
  createdById?: bigint | null,
  options: { force?: boolean } = {}
) {
  return prisma.$transaction(async (tx) => {
    if (!options.force) {
      const latest = await tx.pageVersion.findFirst({
        where: { pageId },
        orderBy: { versionNumber: 'desc' },
        select: { snapshotJson: true },
      });
      if (latest && stableJson(latest.snapshotJson) === stableJson(snapshotJson)) {
        return null;
      }
    }

    const versionNumber = await getNextVersionNumber(pageId, tx);
    return tx.pageVersion.create({
      data: {
        pageId,
        versionNumber,
        snapshotJson,
        source,
        createdById: createdById ?? null,
      },
    });
  });
}

export async function listAdminPageVersions(pageIdRaw: string): Promise<SerializedAdminPageVersion[]> {
  const pageId = parsePageId(pageIdRaw);
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, publishedJson: true },
  });
  if (!page) {
    throw new AdminPageValidationError('Page not found');
  }

  const publishedStable = stableJson(page.publishedJson);
  const latestPublish = await prisma.pageVersion.findFirst({
    where: { pageId, source: PageVersionSource.PUBLISH },
    orderBy: { versionNumber: 'desc' },
    select: { id: true },
  });

  const rows = await prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: [{ versionNumber: 'desc' }, { id: 'desc' }],
    include: {
      createdBy: { select: { id: true, displayName: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: Number(row.id),
    pageId: Number(row.pageId),
    versionNumber: row.versionNumber,
    source: row.source,
    createdAt: row.createdAt,
    createdById: row.createdById ? Number(row.createdById) : null,
    createdByName: row.createdBy?.displayName || row.createdBy?.email || null,
    isLive:
      row.source === PageVersionSource.PUBLISH &&
      latestPublish?.id === row.id &&
      stableJson(row.snapshotJson) === publishedStable,
  }));
}

async function syncBuilderNodesFromSnapshot(pageId: number, snapshotJson: unknown) {
  const snapshot =
    snapshotJson && typeof snapshotJson === 'object' && !Array.isArray(snapshotJson)
      ? snapshotJson
      : { nodes: [] };
  const nodes = Array.isArray((snapshot as { nodes?: unknown }).nodes)
    ? (snapshot as { nodes: unknown[] }).nodes
    : [];

  const state = await getBuilderState(pageId);
  if (!state?.draftVersion?.id) {
    return;
  }

  const draftVersionId = state.draftVersion.id;
  const { getDbPool, withTransaction } = await import('@/lib/db');
  await withTransaction(async (connection) => {
    await connection.query(`DELETE FROM builder_nodes WHERE version_id = ?`, [draftVersionId]);
    await connection.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [
      JSON.stringify({ nodes: [] }),
      draftVersionId,
    ]);
  });

  if (nodes.length) {
    const rootsFixed = autoFixTree(nodes);
    validateTree(rootsFixed, null);
    const bulk = flattenTemplateToBulkNodes(rootsFixed, 0);
    await createNodesBulk(pageId, bulk);
  }
}

export async function restoreAdminPageVersion(
  pageIdRaw: string,
  versionIdRaw: string,
  createdById?: bigint | null
) {
  const pageId = parsePageId(pageIdRaw);
  const versionId = BigInt(String(versionIdRaw).trim());

  const version = await prisma.pageVersion.findFirst({
    where: { id: versionId, pageId },
  });
  if (!version) {
    throw new AdminPageValidationError('Version not found');
  }

  const snapshotJson = version.snapshotJson as Prisma.InputJsonValue;

  const page = await prisma.page.update({
    where: { id: pageId },
    data: { draftJson: snapshotJson },
    select: { id: true, draftJson: true, publishedJson: true },
  });

  await syncBuilderNodesFromSnapshot(Number(pageId), snapshotJson);

  await createAdminPageVersion(pageId, snapshotJson, PageVersionSource.RESTORE, createdById, {
    force: true,
  });

  return {
    pageId: Number(pageId),
    restoredVersionId: Number(versionId),
    draftJson: page.draftJson,
  };
}
