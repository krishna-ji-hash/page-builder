/**
 * Full FAQ page section — hero, tabs, accordion grid, support CTA (one insertable section).
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import { defaultSectionLayoutFor } from '@/lib/sectionLayout.js';
import { DEFAULT_FAQ_FULL_PAGE_PROPS } from '@/lib/faqFullPageDefaults.js';

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

export function buildFaqFullPageSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'FAQ Full Page',
    props: {
      meta: {
        sectionTemplate: 'faqFullPage',
        sectionLayout: defaultSectionLayoutFor('faqFullPage'),
        tplPolish: true,
      },
    },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '0' },
      background: {
        backgroundColor: 'var(--token-bg-primary, #f8fafc)',
        backgroundImage:
          'linear-gradient(180deg, var(--token-bg-primary, #ffffff) 0%, var(--token-bg-secondary, #f8fafc) 100%)',
      },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'FAQ full page column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '100%' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'FAQ full page host',
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
                nodeType: 'faq_full_page',
                displayName: 'FAQ full page',
                props: { ...DEFAULT_FAQ_FULL_PAGE_PROPS },
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
