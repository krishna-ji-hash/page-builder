import { extractBodyText, extractFirstHeading, extractFirstParagraph } from './seoPageHelpers.js';
import { heuristicGenerateFaqSchema } from './aiSeoHeuristics.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function titleCase(s) {
  return str(s)
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

/**
 * Heuristic LLM answer blocks for GEO/AEO (no API required).
 */
export function generateLlmAnswerBlocks({ type, pageName, pageSlug, siteName, tree, focusKeyword }) {
  const h1 = extractFirstHeading(tree) || pageName || titleCase(pageSlug);
  const para = extractFirstParagraph(tree) || extractBodyText(tree).slice(0, 200);
  const brand = str(siteName).trim() || 'Dispatch';
  const kw = str(focusKeyword).trim() || 'shipping';

  switch (type) {
    case 'faq': {
      const schema = heuristicGenerateFaqSchema({ pageName: h1, tree });
      const items = (schema.mainEntity || []).map((q) => ({
        question: q.name,
        answer: q.acceptedAnswer?.text || '',
      }));
      return { type, source: 'heuristic', blocks: items, schema };
    }
    case 'definition':
      return {
        type,
        source: 'heuristic',
        blocks: [
          {
            heading: `What is ${h1}?`,
            body: `${h1} is ${para || `a ${kw} solution offered by ${brand} for ecommerce and logistics teams.`}`,
          },
        ],
      };
    case 'comparison':
      return {
        type,
        source: 'heuristic',
        blocks: [
          {
            heading: `${h1} vs traditional ${kw}`,
            body: `Unlike manual carrier booking, ${brand} ${h1.toLowerCase()} centralizes rates, labels, tracking, and NDR workflows — reducing RTO and support overhead for growing brands.`,
          },
        ],
      };
    case 'summary':
      return {
        type,
        source: 'heuristic',
        blocks: [
          {
            heading: `Summary: ${h1}`,
            body: `${para || `${brand} helps businesses ship smarter with multi-carrier ${kw}, automation, and delivery success tools.`}`.slice(0, 320),
          },
        ],
      };
    default:
      throw new Error(`Unknown LLM block type: ${type}`);
  }
}
