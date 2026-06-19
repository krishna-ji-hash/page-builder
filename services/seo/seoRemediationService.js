import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { ensureAbsoluteUrl, resolveSiteOrigin } from '@/lib/seo/absoluteUrl.js';
import { normalizePageSeo, normalizeProjectSeo } from '@/lib/seo/seoEngine.js';
import { heuristicGenerateDescription, heuristicGenerateTitle } from '@/lib/seo/aiSeoHeuristics.js';
import { generateSchemaJsonLd } from '@/lib/seo/seoSchemaGenerator.js';
import { isPlaceholderNavHref, resolvePlaceholderNavHref } from '@/lib/seo/navLinkResolver.js';
import { patchProjectPageSeo } from '@/services/seo/seoDashboardService.js';
import { getProjectSeo, saveProjectSeo } from '@/services/builder/seoService.js';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function looksLikeSlugTitle(title, pageSlug) {
  const t = String(title || '').trim();
  if (!t) return true;
  const norm = (s) => String(s || '').toLowerCase().replace(/[-_\s]+/g, '');
  return norm(t) === norm(pageSlug) || (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(t) && !/\s/.test(t));
}

function remediateMenuItems(items, projectSlug, knownSlugs) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const next = { ...item };
    const raw = next.to ?? next.href;
    if (isPlaceholderNavHref(raw)) {
      const resolved = resolvePlaceholderNavHref(next.label, projectSlug, knownSlugs);
      if (resolved) {
        next.to = resolved;
        if ('href' in next) next.href = resolved;
      }
    }
    if (Array.isArray(next.children) && next.children.length) {
      next.children = remediateMenuItems(next.children, projectSlug, knownSlugs);
    }
    return next;
  });
}

function remediateTreeNavLinks(nodes, projectSlug, knownSlugs) {
  if (!Array.isArray(nodes)) return nodes;
  return nodes.map((node) => {
    if (!node || typeof node !== 'object') return node;
    let next = { ...node };
    const type = next.nodeType || next.node_type;
    if (type === 'menu' && next.props?.items) {
      next = {
        ...next,
        props: {
          ...(next.props || {}),
          items: remediateMenuItems(next.props.items, projectSlug, knownSlugs),
        },
      };
    }
    if (type === 'button' && isPlaceholderNavHref(next.props?.href)) {
      const resolved = resolvePlaceholderNavHref(
        next.props?.text || next.displayName,
        projectSlug,
        knownSlugs
      );
      if (resolved) {
        next = { ...next, props: { ...(next.props || {}), href: resolved } };
      }
    }
    if (Array.isArray(next.children) && next.children.length) {
      next = { ...next, children: remediateTreeNavLinks(next.children, projectSlug, knownSlugs) };
    }
    return next;
  });
}

async function loadProjectPages(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.updated_at DESC`,
    [Number(projectId)]
  );
  return rows;
}

/**
 * Run ordered SEO remediation for a project (persists to pages.seo_json + optional nav tree fixes).
 */
export async function runSeoRemediation(projectId) {
  const pid = Number(projectId);
  const { config } = await getProjectSeo(pid);
  const projectSeo = normalizeProjectSeo(config);
  const origin = resolveSiteOrigin(projectSeo);

  const pool = getDbPool();
  const [projRows] = await pool.query(`SELECT slug FROM projects WHERE id = ? LIMIT 1`, [pid]);
  const projectSlug = projRows[0]?.slug || 'dispatch';
  const pageRows = await loadProjectPages(pid);
  const knownSlugs = pageRows.map((r) => r.slug).filter(Boolean);

  const results = [];

  // Step 0 — ensure canonical domain in project SEO when SITE_URL is set
  if (!projectSeo.canonicalDomain && origin) {
    await saveProjectSeo(pid, { canonicalDomain: origin });
    projectSeo.canonicalDomain = origin;
    results.push({ step: 'project-canonical-domain', ok: true, value: origin });
  }

  for (const row of pageRows) {
    const pageId = row.id;
    const pageSlug = row.slug;
    const pagePath = publicPagePath(projectSlug, pageSlug);
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const tree = parseJson(row.snapshot_json, {})?.nodes || [];
    const patch = {};

    // 1. Absolute canonical
    const canonical = ensureAbsoluteUrl(origin || projectSeo.canonicalDomain, pageSeo.canonicalUrl || pagePath);
    if (canonical && canonical !== pageSeo.canonicalUrl) patch.canonicalUrl = canonical;

    // 2. Schema with url + description
    const titleForSchema =
      pageSeo.title && !looksLikeSlugTitle(pageSeo.title, pageSlug)
        ? pageSeo.title
        : heuristicGenerateTitle({ pageName: row.title, pageSlug, siteName: projectSeo.siteTitle, tree });
    const descForSchema =
      pageSeo.description ||
      heuristicGenerateDescription({ pageName: row.title, pageSlug, tree, focusKeyword: pageSeo.focusKeyword });
    const schemaType = pageSeo.schemaType || 'WebPage';
    const schemaJsonLd = generateSchemaJsonLd({
      schemaType,
      projectSeo,
      pageSeo: { ...pageSeo, title: titleForSchema, description: descForSchema },
      pageName: row.title,
      canonical,
    });
    if (schemaJsonLd) {
      patch.schemaType = schemaType;
      patch.schemaTemplate = schemaJsonLd;
    }

    // 3. Readable SEO title
    if (!pageSeo.title || looksLikeSlugTitle(pageSeo.title, pageSlug)) {
      patch.title = heuristicGenerateTitle({
        pageName: row.title,
        pageSlug,
        siteName: projectSeo.siteTitle,
        tree,
      });
    }

    // 4. Meta description
    if (!pageSeo.description) {
      patch.description = heuristicGenerateDescription({
        pageName: row.title,
        pageSlug,
        tree,
        focusKeyword: pageSeo.focusKeyword,
      });
    }

    // 5. OG + Twitter images (absolute)
    const ogRaw = pageSeo.ogImage || projectSeo.defaultOgImage;
    const ogAbs = ensureAbsoluteUrl(origin, ogRaw);
    if (ogAbs && ogAbs !== pageSeo.ogImage) patch.ogImage = ogAbs;
    if (ogAbs && ogAbs !== pageSeo.twitterImage) patch.twitterImage = ogAbs;

    if (Object.keys(patch).length) {
      await patchProjectPageSeo(pid, pageId, patch);
      results.push({ step: 'page-seo', pageId, pageSlug, ok: true, patch });
    }
  }

  // 6. Replace # nav links on home published snapshot
  const homeRow = pageRows.find((r) => r.slug === 'home');
  if (homeRow?.snapshot_json) {
    const snapshot = parseJson(homeRow.snapshot_json, {}) || {};
    const nodes = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
    const fixed = remediateTreeNavLinks(nodes, projectSlug, knownSlugs);
    const changed = JSON.stringify(fixed) !== JSON.stringify(nodes);
    if (changed) {
      const [pub] = await pool.query(`SELECT published_version_id FROM pages WHERE id = ? LIMIT 1`, [homeRow.id]);
      const versionId = pub[0]?.published_version_id;
      if (versionId) {
        await pool.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [
          JSON.stringify({ ...snapshot, nodes: fixed }),
          versionId,
        ]);
        results.push({ step: 'home-nav-links', ok: true, pageId: homeRow.id });
      }
    }
  }

  return { projectId: pid, origin, pages: pageRows.length, results };
}
