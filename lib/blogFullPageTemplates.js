/**
 * Full blog page section — hero, tabs, featured, grid, guides, newsletter, CTA.
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import { defaultSectionLayoutFor } from '@/lib/sectionLayout.js';
import { DEFAULT_BLOG_FULL_PAGE_PROPS } from '@/lib/blogFullPageDefaults.js';

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

export function buildBlogFullPageSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Blog Full Page',
    props: {
      meta: {
        sectionTemplate: 'blogFullPage',
        sectionLayout: defaultSectionLayoutFor('blogFullPage'),
        tplPolish: true,
      },
    },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '0' },
      background: {
        backgroundColor: 'var(--token-bg-primary, #ffffff)',
        backgroundImage:
          'linear-gradient(180deg, var(--token-bg-primary, #ffffff) 0%, var(--token-bg-secondary, #f8fafc) 100%)',
      },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Blog full page column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '100%' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Blog full page host',
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
                nodeType: 'blog_full_page',
                displayName: 'Blog full page',
                props: { ...DEFAULT_BLOG_FULL_PAGE_PROPS },
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
