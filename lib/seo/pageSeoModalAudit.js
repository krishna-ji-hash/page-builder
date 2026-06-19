import { runSeoAudit } from './seoAuditEngine.js';
import { extractFirstHeading, walkTreeNodes } from './seoPageHelpers.js';

const TITLE_MIN = 15;
const TITLE_MAX = 70;
const DESC_MIN = 50;
const DESC_MAX = 160;

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function safeTrim(v) {
  return str(v).replace(/\s+/g, ' ').trim();
}

function wordCountFromTree(tree) {
  let words = 0;
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'text' || node?.nodeType === 'paragraph' || node?.nodeType === 'richText') {
      const t = str(node.props?.text || node.props?.content || '');
      words += t.split(/\s+/).filter(Boolean).length;
    }
  });
  return words;
}

function countHeadings(tree) {
  let count = 0;
  let firstH1 = '';
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'heading') {
      count += 1;
      if (!firstH1 && node?.props?.text) firstH1 = safeTrim(node.props.text);
    }
  });
  return { count, firstH1 };
}

function countMissingAlt(tree) {
  let missing = 0;
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'image' && !safeTrim(node.props?.alt)) missing += 1;
  });
  return missing;
}

function includesKeyword(text, keyword) {
  const t = safeTrim(text).toLowerCase();
  const k = safeTrim(keyword).toLowerCase();
  return Boolean(k && t.includes(k));
}

/**
 * Live page SEO audit for the builder modal — grouped checklist + score.
 */
export function runPageSeoModalAudit({ tree, pageSeo, projectSeo }) {
  const base = runSeoAudit({ pageSeo, projectSeo, tree });
  const title = safeTrim(pageSeo?.title);
  const description = safeTrim(pageSeo?.description);
  const focusKeyword = safeTrim(pageSeo?.focusKeyword);
  const ogImage = safeTrim(pageSeo?.ogImage || projectSeo?.defaultOgImage);
  const canonical = safeTrim(pageSeo?.canonicalUrl || projectSeo?.canonicalDomain);
  const hasSchema = Boolean(pageSeo?.schemaTemplate || pageSeo?.schemaJsonLd || pageSeo?.schemaType);

  const { count: headingCount, firstH1 } = countHeadings(tree);
  const missingAlt = countMissingAlt(tree);
  const wordCount = wordCountFromTree(tree);

  const critical = [];
  const warnings = [];
  const passed = [];

  const pushIssue = (list, id, label) => list.push({ id, label });

  if (!title) pushIssue(critical, 'missing-title', 'Missing SEO title');
  if (!description) pushIssue(critical, 'missing-description', 'Missing meta description');
  if (headingCount === 0) pushIssue(critical, 'missing-h1', 'Missing H1 heading');
  if (pageSeo?.noindex) pushIssue(critical, 'noindex', 'noindex enabled');

  if (title) {
    if (title.length < TITLE_MIN) pushIssue(warnings, 'title-short', `Title too short (${title.length})`);
    else if (title.length > TITLE_MAX) pushIssue(warnings, 'title-long', `Title too long (${title.length})`);
    else pushIssue(passed, 'title-length', 'Title length OK');
  }

  if (description) {
    if (description.length < DESC_MIN) pushIssue(warnings, 'desc-short', `Description too short (${description.length})`);
    else if (description.length > DESC_MAX) pushIssue(warnings, 'desc-long', `Description too long (${description.length})`);
    else pushIssue(passed, 'desc-length', 'Description length OK');
  }

  if (headingCount === 1) pushIssue(passed, 'h1-ok', 'Single H1 present');
  if (headingCount > 1) pushIssue(warnings, 'multiple-h1', `Multiple H1 headings (${headingCount})`);

  if (!ogImage) pushIssue(warnings, 'missing-og-image', 'Missing OG image');
  if (!canonical) pushIssue(warnings, 'missing-canonical', 'Missing canonical URL');
  if (missingAlt > 0) pushIssue(warnings, 'missing-alt', `Missing image alt (${missingAlt})`);
  else if (tree?.length) pushIssue(passed, 'alt-ok', 'Image alt text OK');

  if (focusKeyword) {
    if (title && !includesKeyword(title, focusKeyword)) {
      pushIssue(warnings, 'kw-not-in-title', 'Focus keyword missing in title');
    } else if (title) pushIssue(passed, 'kw-in-title', 'Focus keyword in title');

    if (description && !includesKeyword(description, focusKeyword)) {
      pushIssue(warnings, 'kw-not-in-desc', 'Focus keyword missing in description');
    } else if (description) pushIssue(passed, 'kw-in-desc', 'Focus keyword in description');

    if (firstH1 && !includesKeyword(firstH1, focusKeyword)) {
      pushIssue(warnings, 'kw-not-in-h1', 'Focus keyword missing in H1');
    } else if (firstH1) pushIssue(passed, 'kw-in-h1', 'Focus keyword in H1');
  } else {
    pushIssue(warnings, 'no-focus-kw', 'No focus keyword set');
  }

  if (wordCount > 0 && wordCount < 120) {
    pushIssue(warnings, 'thin-content', `Thin content (${wordCount} words)`);
  }

  if (!pageSeo?.noindex && projectSeo?.indexingEnabled !== false) {
    pushIssue(passed, 'indexable', 'Page is indexable');
  }

  if (hasSchema) pushIssue(passed, 'schema-present', 'Schema present');
  else pushIssue(warnings, 'missing-schema', 'No schema configured');

  return {
    score: base.score,
    critical,
    warnings,
    passed,
    wordCount,
    headingCount,
    missingAlt,
    firstH1,
    baseIssues: base.issues,
  };
}

export const PAGE_SEO_QUICK_FIXES = [
  { id: 'title-from-h1', label: 'Generate title from H1' },
  { id: 'desc-from-paragraph', label: 'Generate description from first paragraph' },
  { id: 'canonical-from-slug', label: 'Add canonical from slug' },
  { id: 'default-og-image', label: 'Use default OG image' },
  { id: 'webpage-schema', label: 'Add WebPage schema' },
  { id: 'enable-index', label: 'Enable index / follow' },
];
