/**
 * Full blog detail section — hero, article body, sidebar, bottom CTA.
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import { defaultSectionLayoutFor } from '@/lib/sectionLayout.js';
import { DEFAULT_BLOG_DETAIL_PAGE_PROPS } from '@/lib/blogDetailPageDefaults.js';

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

export function buildBlogDetailPageSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Blog Detail Page',
    props: {
      meta: {
        sectionTemplate: 'blogDetailPage',
        sectionLayout: defaultSectionLayoutFor('blogDetailPage'),
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
        displayName: 'Blog detail column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '100%' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Blog detail host',
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
                nodeType: 'blog_detail_page',
                displayName: 'Blog detail page',
                props: { ...DEFAULT_BLOG_DETAIL_PAGE_PROPS },
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

/** Page body roots for live /blog/[slug] — one row with blog_detail_page props. */
export function buildBlogDetailPageBodyNodes(detailProps) {
  const row = buildBlogDetailPageSectionRow();
  const column = row.children?.[0];
  const stack = column?.children?.[0];
  const widget = stack?.children?.[0];
  if (!widget || widget.nodeType !== 'blog_detail_page') return [row];

  return [
    {
      ...row,
      children: [
        {
          ...column,
          children: [
            {
              ...stack,
              children: [
                {
                  ...widget,
                  props: { ...(detailProps && typeof detailProps === 'object' ? detailProps : {}) },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
