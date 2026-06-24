import bcrypt from 'bcryptjs';
import {
  PrismaClient,
  PageStatus,
  ProjectStatus,
  ProjectType,
  UserRole,
  type Prisma,
} from '@prisma/client';
import { DEFAULT_BUILDER_PAGE_JSON } from './defaultBuilderPage';
import { buildDefaultStarterPageJson } from '../lib/site/defaultStarterPageJson';

const prisma = new PrismaClient();

const DEFAULT_PROJECT_SLUG = 'main-site';
const DEFAULT_PAGE_SLUG = 'home';
const SITE_SETTING_ID = 'main';
const BCRYPT_ROUNDS = 12;

type BuilderNodeSpec = {
  nodeType: string;
  displayName: string;
  positionIndex: number;
  props?: Record<string, unknown>;
  children?: BuilderNodeSpec[];
};

function adminEmailFromEnv() {
  return String(process.env.ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@localhost')
    .trim()
    .toLowerCase();
}

function adminPasswordFromEnv() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
}

function adminDisplayNameFromEnv() {
  return process.env.ADMIN_BOOTSTRAP_NAME || 'Super Admin';
}

async function hashAdminPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function seedAdminUser() {
  const email = adminEmailFromEnv();
  const password = adminPasswordFromEnv();
  if (!password) {
    console.log('Skip admin seed — set ADMIN_PASSWORD (or ADMIN_BOOTSTRAP_PASSWORD) in .env');
    return null;
  }

  const passwordHash = await hashAdminPassword(password);
  const displayName = adminDisplayNameFromEnv();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      displayName,
      role: UserRole.super_admin,
      isActive: true,
    },
    update: {
      passwordHash,
      displayName,
      role: UserRole.super_admin,
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${email}`);
  return user;
}

async function seedDefaultProject() {
  const name = 'Main Website';
  const project = await prisma.project.upsert({
    where: { slug: DEFAULT_PROJECT_SLUG },
    create: {
      name,
      title: name,
      slug: DEFAULT_PROJECT_SLUG,
      domain: null,
      homeSlug: DEFAULT_PAGE_SLUG,
      status: ProjectStatus.ACTIVE,
      type: ProjectType.website,
      configJson: {
        siteTheme: { mode: 'light' },
      },
    },
    update: {
      name,
      title: name,
      domain: null,
      homeSlug: DEFAULT_PAGE_SLUG,
      status: ProjectStatus.ACTIVE,
    },
  });

  console.log(`Seeded project: ${project.slug} (id=${project.id})`);
  return project;
}

async function insertBuilderNodes(
  tx: Prisma.TransactionClient,
  pageId: bigint,
  versionId: bigint,
  nodes: BuilderNodeSpec[],
  parentNodeId: bigint | null = null
) {
  for (const node of nodes) {
    const props = node.props && typeof node.props === 'object' ? node.props : {};
    await tx.$executeRaw`
      INSERT INTO builder_nodes
        (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index)
      VALUES
        (${pageId}, ${versionId}, ${parentNodeId}, ${node.nodeType}, ${node.displayName},
         ${JSON.stringify(props)}, ${node.positionIndex ?? 0})
    `;
    const idRows = await tx.$queryRaw<{ id: bigint }[]>`SELECT LAST_INSERT_ID() AS id`;
    const nodeId = BigInt(idRows[0]?.id ?? 0);
    if (node.children?.length && nodeId > 0n) {
      await insertBuilderNodes(tx, pageId, versionId, node.children, nodeId);
    }
  }
}

async function seedHomePage(projectId: bigint) {
  const sectionsContent = buildDefaultStarterPageJson('Main Website');
  const snapshot = {
    ...sectionsContent,
    nodes: DEFAULT_BUILDER_PAGE_JSON.nodes,
  };
  const snapshotJson = JSON.stringify(snapshot);
  const now = new Date();

  const page = await prisma.$transaction(async (tx) => {
    const upserted = await tx.page.upsert({
      where: {
        projectId_slug: {
          projectId,
          slug: DEFAULT_PAGE_SLUG,
        },
      },
      create: {
        projectId,
        title: 'Home',
        slug: DEFAULT_PAGE_SLUG,
        status: PageStatus.published,
        draftJson: snapshot,
        publishedJson: snapshot,
        publishedAt: now,
      },
      update: {
        title: 'Home',
        status: PageStatus.published,
        draftJson: snapshot,
        publishedJson: snapshot,
        publishedAt: now,
      },
    });

    await tx.$executeRaw`DELETE FROM builder_nodes WHERE page_id = ${upserted.id}`;
    await tx.$executeRaw`DELETE FROM page_versions WHERE page_id = ${upserted.id}`;

    await tx.$executeRaw`
      INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
      VALUES (${upserted.id}, 1, 'published', ${snapshotJson})
    `;

    const versionRows = await tx.$queryRaw<{ id: bigint }[]>`
      SELECT id FROM page_versions
      WHERE page_id = ${upserted.id} AND status = 'published'
      ORDER BY id DESC LIMIT 1
    `;
    const publishedVersionId = versionRows[0]?.id;
    if (!publishedVersionId) {
      throw new Error('Failed to create published page version for Home page');
    }

    await insertBuilderNodes(tx, upserted.id, publishedVersionId, snapshot.nodes as BuilderNodeSpec[]);

    await tx.$executeRaw`
      INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
      VALUES (${upserted.id}, 2, 'draft', ${snapshotJson})
    `;

    const draftRows = await tx.$queryRaw<{ id: bigint }[]>`
      SELECT id FROM page_versions
      WHERE page_id = ${upserted.id} AND status = 'draft'
      ORDER BY id DESC LIMIT 1
    `;
    const draftVersionId = draftRows[0]?.id;
    if (draftVersionId) {
      await insertBuilderNodes(tx, upserted.id, draftVersionId, snapshot.nodes as BuilderNodeSpec[]);
    }

    return tx.page.update({
      where: { id: upserted.id },
      data: { publishedVersionId },
    });
  });

  console.log(`Seeded Home page: /${DEFAULT_PROJECT_SLUG}/${DEFAULT_PAGE_SLUG} (id=${page.id})`);
  return page;
}

async function seedSiteSetting(projectId: bigint) {
  const settings = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: {
      id: SITE_SETTING_ID,
      activeProjectId: projectId,
    },
    update: {
      activeProjectId: projectId,
    },
  });

  console.log(`Seeded site_settings: activeProjectId=${settings.activeProjectId}`);
  return settings;
}

async function main() {
  console.log('Prisma seed — multi-project default data\n');

  await seedAdminUser();
  const project = await seedDefaultProject();
  await seedHomePage(project.id);
  await seedSiteSetting(project.id);

  console.log('\nPrisma seed complete.');
}

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
