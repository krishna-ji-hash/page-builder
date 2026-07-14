/**
 * Individual blog detail section rows — hero, article, sidebar, CTA.
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import { defaultSectionLayoutFor } from '@/lib/sectionLayout.js';
import { BLOG_DETAIL_SECTION_DEFS } from '@/lib/blogDetailSectionRegistry.js';

const desktop = (patch) => ({ desktop: { ...patch } });
const rowMobileStack = { ...ROW_MOBILE_STACK_FRAGMENT };
const colMobileFull = { ...COLUMN_MOBILE_PATCH };

function columnStyle(desktopLayer = {}) {
  return {
    desktop: { ...desktopLayer, spacing: { padding: '0', ...(desktopLayer.spacing || {}) } },
    ...colMobileFull,
  };
}

function rowStyle(desktopPatch) {
  return { ...rowMobileStack, desktop: { ...desktopPatch } };
}

/**
 * @param {import('@/lib/blogDetailSectionRegistry.js').BlogDetailSectionDef} def
 */
export function buildBlogDetailSectionRow(def) {
  return {
    nodeType: 'row',
    displayName: def.label,
    props: {
      meta: {
        sectionTemplate: def.templateId,
        sectionLayout: defaultSectionLayoutFor(def.templateId),
        tplPolish: true,
      },
    },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '0' },
      background: {
        backgroundColor: 'var(--token-bg-primary, #ffffff)',
      },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: `${def.shortLabel} column`,
        style_json: columnStyle({ size: { width: '100%', maxWidth: '100%' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: `${def.shortLabel} host`,
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 0,
                alignItems: 'stretch',
                width: '100%',
              },
            }),
            children: [
              {
                nodeType: def.nodeType,
                displayName: def.shortLabel,
                props: def.defaultProps(),
                style_json: desktop({
                  layout: { width: '100%' },
                  spacing: { padding: '0' },
                }),
              },
            ],
          },
        ],
      },
    ],
  };
}

/** @type {Record<string, () => object>} */
export const BLOG_DETAIL_SECTION_TEMPLATE_BUILDERS = Object.fromEntries(
  BLOG_DETAIL_SECTION_DEFS.map((def) => [def.templateId, () => buildBlogDetailSectionRow(def)])
);

/** All four detail sections in order — for quick blog-post page setup. */
export function buildBlogDetailPageAllSectionsRows() {
  return BLOG_DETAIL_SECTION_DEFS.map((def) => buildBlogDetailSectionRow(def));
}
