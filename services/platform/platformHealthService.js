import { getDbPool } from '@/lib/db';
import {
  auditHardcodedColors,
  auditSectionContrastBannedProps,
  scoreDarkModeHealth,
} from '@/scripts/audit-hardcoded-colors.mjs';
import { runTreeAudits, scoreFromWarnings } from '@/lib/audits/auditEngine';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function getPlatformHealth() {
  const pool = getDbPool();
  const contrastFindings = auditHardcodedColors();
  const bannedProps = auditSectionContrastBannedProps();
  const sectionContrastScore = Math.max(
    0,
    100 - bannedProps.length * 5 - contrastFindings.length * 2
  );
  const builderHealth = {
    score: scoreDarkModeHealth(contrastFindings),
    label: 'Builder / section contrast',
    findings: contrastFindings.length,
    bannedColorProps: bannedProps.length,
  };

  let cmsCollections = 0;
  let cmsItems = 0;
  let publishedPages = 0;
  let sampleSeoScore = 85;
  let sampleAuditScore = 80;

  try {
    const [[cmsCol]] = await pool.query(`SELECT COUNT(*) AS c FROM cms_collections`);
    const [[cmsIt]] = await pool.query(`SELECT COUNT(*) AS c FROM cms_items`);
    cmsCollections = Number(cmsCol?.c || 0);
    cmsItems = Number(cmsIt?.c || 0);
  } catch {
    /* CMS tables optional */
  }

  try {
    const [[pub]] = await pool.query(
      `SELECT COUNT(*) AS c FROM pages WHERE status = 'published' AND published_version_id IS NOT NULL`
    );
    publishedPages = Number(pub?.c || 0);

    const [sample] = await pool.query(
      `SELECT p.seo_json, pv.snapshot_json, pr.config_json
       FROM pages p
       INNER JOIN page_versions pv ON pv.id = p.published_version_id
       INNER JOIN projects pr ON pr.id = p.project_id
       WHERE p.published_version_id IS NOT NULL
       LIMIT 1`
    );
    if (sample.length) {
      const snap = parseJson(sample[0].snapshot_json, { nodes: [] });
      const config = parseJson(sample[0].config_json, {});
      const audit = runTreeAudits({
        tree: snap.nodes || [],
        pageSeo: parseJson(sample[0].seo_json, {}),
        projectConfig: config,
      });
      sampleAuditScore = scoreFromWarnings(audit.warnings);
      sampleSeoScore = sampleAuditScore;
    }
  } catch {
    /* DB offline */
  }

  const seoHealth = {
    score: sampleSeoScore,
    label: 'SEO Assistant (sample published page)',
    publishedPages,
  };

  const cmsHealth = {
    score: cmsCollections > 0 ? Math.min(100, 60 + cmsItems) : 50,
    label: 'CMS',
    collections: cmsCollections,
    items: cmsItems,
  };

  const performanceHealth = {
    score: publishedPages > 0 ? 78 : 55,
    label: 'Performance (published surface)',
    note: 'Run npm run battle-test:lighthouse for deep metrics',
  };

  const panels = [
    { id: 'builder', ...builderHealth },
    { id: 'seo', ...seoHealth },
    { id: 'cms', ...cmsHealth },
    { id: 'performance', ...performanceHealth },
    {
      id: 'section-contrast',
      score: sectionContrastScore,
      label: 'Section contrast audit',
      findings: bannedProps.length,
    },
  ];

  const overall = Math.round(
    panels.reduce((sum, p) => sum + Number(p.score || 0), 0) / panels.length
  );

  return { overall, panels, generatedAt: new Date().toISOString() };
}
