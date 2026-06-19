import { buildSchemaTemplateFromFields } from './schemaFieldDefs.js';
import {
  extractFirstHeading,
  extractFirstParagraph,
  extractBodyText,
  analyzeHeadingHierarchy,
  countWords,
} from './seoPageHelpers.js';
import { getDispatchPreset, matchDispatchPresetFromContent } from './aiSeoPresets.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function clamp(text, min, max) {
  let s = str(text).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length > max) {
    s = s.slice(0, max - 1).trimEnd();
    if (!/[.!?]$/.test(s)) s += '…';
  }
  if (s.length < min && s.length > 0) return s;
  return s;
}

function titleCase(s) {
  return str(s)
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function slugToTitle(slug) {
  return titleCase(str(slug).replace(/[-_]+/g, ' '));
}

function topTerms(body, limit = 5) {
  const stop = new Set(['the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'are', 'our', 'you', 'all']);
  const freq = new Map();
  for (const w of str(body).toLowerCase().split(/\W+/)) {
    if (w.length < 4 || stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

export function heuristicGenerateTitle({ pageName, pageSlug, siteName, tree, presetId }) {
  const h1 = extractFirstHeading(tree);
  const site = str(siteName).trim() || 'Dispatch';
  const preset = presetId ? getDispatchPreset(presetId) : null;
  const base = h1 || pageName || slugToTitle(pageSlug);
  let title = base.length > 50 ? clamp(base, 15, 60) : `${base} | ${site}`;
  if (preset && !title.toLowerCase().includes(preset.label.toLowerCase())) {
    title = clamp(`${base} — ${preset.label} ${site}`, 15, 70);
  }
  return clamp(title, 15, 70);
}

export function heuristicGenerateDescription({ pageName, pageSlug, tree, focusKeyword, presetId }) {
  const para = extractFirstParagraph(tree) || extractBodyText(tree);
  const preset = presetId ? getDispatchPreset(presetId) : null;
  const kw = focusKeyword || preset?.focusKeywords?.[0] || slugToTitle(pageSlug);
  let desc = para;
  if (!desc) {
    desc = `Discover ${pageName || slugToTitle(pageSlug)} — ${kw}. Learn how Dispatch helps businesses ship smarter with multi-carrier logistics.`;
  }
  if (kw && !desc.toLowerCase().includes(kw.toLowerCase())) {
    desc = `${desc} ${kw}.`.replace(/\s+/g, ' ').trim();
  }
  return clamp(desc, 120, 160);
}

export function heuristicGenerateKeywords({ pageName, pageSlug, tree, presetId }) {
  const body = extractBodyText(tree);
  const autoPreset = presetId || matchDispatchPresetFromContent(`${pageName} ${pageSlug} ${body}`);
  const preset = autoPreset ? getDispatchPreset(autoPreset) : null;
  const terms = topTerms(body, 4);
  const focus = preset?.focusKeywords?.[0] || terms[0] || slugToTitle(pageSlug).split(' ')[0] || 'shipping';
  const secondary = [...new Set([...(preset?.secondary || []), ...terms.slice(0, 3)])].slice(0, 6);
  const longTail = [...(preset?.longTail || []), `${focus} for ecommerce`, `${focus} india`].slice(0, 6);
  return { focusKeyword: focus, secondaryKeywords: secondary, longTailKeywords: longTail };
}

export function heuristicGenerateFaqSchema({ pageName, tree }) {
  const headings = analyzeHeadingHierarchy(tree).outline.filter((h) => h.level >= 2).slice(0, 5);
  const questions =
    headings.length > 0
      ? headings.map((h) => ({
          question: h.text.endsWith('?') ? h.text : `What is ${h.text}?`,
          answer: `Learn more about ${h.text} on our ${pageName || 'site'}.`,
        }))
      : [
          { question: `What is ${pageName || 'this service'}?`, answer: extractFirstParagraph(tree) || 'Contact us to learn more.' },
          { question: 'How do I get started?', answer: 'Sign up and connect your sales channels to start shipping.' },
        ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: pageName || 'FAQ',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

export function heuristicGenerateSchema({ schemaType, pageName }) {
  const type = schemaType || 'WebPage';
  const tpl = buildSchemaTemplateFromFields(type, {});
  if (tpl) return tpl;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: '{{title}}',
    description: '{{description}}',
    url: '{{url}}',
  };
}

export function buildPageContext({ pageName, pageSlug, siteName, tree, projectSeo, pageSeo }) {
  const body = extractBodyText(tree);
  const h1 = extractFirstHeading(tree);
  const para = extractFirstParagraph(tree);
  return {
    pageName: pageName || pageSlug,
    pageSlug,
    siteName: siteName || projectSeo?.siteTitle || '',
    tree: Array.isArray(tree) ? tree : [],
    h1,
    firstParagraph: para,
    bodyExcerpt: clamp(body, 50, 1200),
    wordCount: countWords(body),
    existingTitle: str(pageSeo?.title),
    existingDescription: str(pageSeo?.description),
    focusKeyword: str(pageSeo?.focusKeyword),
  };
}
