import { getDbPool, withTransaction } from '@/lib/db';
import { getIndustryBlueprint } from '@/lib/platform/industryBlueprint';
import {
  buildBulkNodesForPageSections,
  buildPageSeoDefaults,
  buildProjectConfigFromWizard,
} from '@/lib/platform/templateDeployment';
import {
  createNodesBulk,
  createPageForProject,
} from '@/services/builder/builderService';

function parseJsonColumn(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function cloneCmsCollectionsTx(projectId, collections, connection) {
  if (!Array.isArray(collections) || !collections.length) return [];
  const created = [];
  for (const col of collections) {
    const name = String(col.name || '').trim();
    const slug = String(col.slug || '').trim();
    if (!name || !slug) continue;
    const [existing] = await connection.query(
      `SELECT id FROM cms_collections WHERE project_id = ? AND slug = ? LIMIT 1`,
      [projectId, slug]
    );
    if (existing.length) continue;
    const [insert] = await connection.query(
      `INSERT INTO cms_collections (project_id, name, slug, type, schema_json)
       VALUES (?, ?, ?, ?, ?)`,
      [
        projectId,
        name,
        slug,
        String(col.type || 'custom'),
        JSON.stringify(col.schema || { fields: [] }),
      ]
    );
    created.push({ id: insert.insertId, slug, name });
  }
  return created;
}

/**
 * Provision a full project from wizard payload.
 * Preserves renderTree, style_json, publish snapshot architecture.
 */
function assertWizardName(name) {
  const v = String(name || '').trim();
  if (!v) throw new Error('Invalid name: value is required');
  return v;
}

function assertWizardSlug(slug) {
  const v = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!v) throw new Error('Invalid slug: value is required');
  return v;
}

export async function provisionProjectFromWizard(payload) {
  const name = assertWizardName(payload?.name);
  const slug = assertWizardSlug(payload?.slug);
  const industryId = String(payload?.industry || 'custom').trim();
  const themeId = String(payload?.theme || 'light').trim();
  const templateId = String(payload?.templateId || '').trim();

  const blueprint = getIndustryBlueprint(industryId);
  const config = buildProjectConfigFromWizard({ name, slug, themeId, industryId });
  if (templateId) {
    config.wizardMeta = { ...config.wizardMeta, templateId };
  }

  let projectId = null;
  try {
    const projectRow = await withTransaction(async (connection) => {
      const [dupRows] = await connection.query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [
        slug,
      ]);
      if (dupRows.length) throw new Error('Project slug already exists');

      const [insertProject] = await connection.query(
        `INSERT INTO projects (name, title, slug, type, config_json)
         VALUES (?, ?, ?, 'website', ?)`,
        [name, name, slug, JSON.stringify(config)]
      );
      const pid = insertProject.insertId;
      const cmsCollections = await cloneCmsCollectionsTx(
        pid,
        blueprint.cmsCollections,
        connection
      );
      const [projectRows] = await connection.query(
        `SELECT id, COALESCE(NULLIF(name, ''), 'Untitled Project') AS name, slug, type, config_json, created_at, updated_at
         FROM projects WHERE id = ?`,
        [pid]
      );
      return { project: projectRows[0], cmsCollections };
    });

    projectId = projectRow.project.id;
    const pages = [];

    for (const pageDef of blueprint.pages) {
      const page = await createPageForProject(projectId, {
        title: pageDef.title,
        slug: pageDef.slug,
        createStarter: false,
      });

      const bulkNodes = buildBulkNodesForPageSections(pageDef.sections);
      if (bulkNodes.length) {
        await createNodesBulk(page.id, bulkNodes);
      }

      const seo = buildPageSeoDefaults({
        projectName: name,
        pageTitle: pageDef.title,
        pageSlug: pageDef.slug,
      });
      await getDbPool().query(`UPDATE pages SET seo_json = ? WHERE id = ?`, [
        JSON.stringify(seo),
        page.id,
      ]);

      pages.push({ ...page, seo, sectionKeys: pageDef.sections });
    }

    return {
      project: {
        id: projectRow.project.id,
        name: projectRow.project.name,
        slug: projectRow.project.slug,
        type: projectRow.project.type,
        configJson: parseJsonColumn(projectRow.project.config_json),
        createdAt: projectRow.project.created_at,
        updatedAt: projectRow.project.updated_at,
      },
      pages,
      seoDefaults: config.seo,
      globalSections: config.globalSections,
      cmsCollections: projectRow.cmsCollections,
      themeTokens: config.themeTokens,
      stylePresets: config.stylePresets,
      animationPresets: config.animationPresets,
    };
  } catch (error) {
    if (projectId) {
      const { deleteProjectSafely } = await import('@/services/builder/builderService');
      try {
        await deleteProjectSafely(projectId);
      } catch {
        /* best-effort rollback */
      }
    }
    throw error;
  }
}

/** List template options for wizard step 4. */
export function listWizardTemplates(industryId) {
  const blueprint = getIndustryBlueprint(industryId);
  return {
    industryId,
    templates: [
      {
        id: blueprint.defaultTemplateId || `${industryId}-starter`,
        label: `${industryId.replace(/-/g, ' ')} starter pack`,
        pageCount: blueprint.pages.length,
        pages: blueprint.pages.map((p) => ({ slug: p.slug, title: p.title })),
      },
    ],
  };
}
