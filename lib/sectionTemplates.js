/**
 * Declarative section trees (no ids). Prefer bulk API insert for stable ordering + one snapshot refresh.
 * Shapes: row → column → stack → blocks.
 */

import { COLUMN_MOBILE_PATCH, ROW_MOBILE_STACK_FRAGMENT } from '@/lib/responsiveLayoutDefaults';

const desktop = (patch) => ({ desktop: { ...patch } });

/** Default: sections stack vertically on small breakpoints (override with explicit mobile in style_json). */
const rowMobileStack = { ...ROW_MOBILE_STACK_FRAGMENT };

const colMobileFull = { ...COLUMN_MOBILE_PATCH };

function columnStyle(desktopLayer = {}) {
  return {
    desktop: { ...desktopLayer },
    ...colMobileFull,
  };
}

function rowStyle(desktopPatch) {
  return {
    ...rowMobileStack,
    desktop: { ...desktopPatch },
  };
}

export const SECTION_TEMPLATES = {
  /**
   * Page header: Row → 3× (Column → Stack → blocks). Logo | nav | actions.
   * Row stacks columns on mobile via `rowStyle`; alignment uses `meta.headerAlign` + row `justifyContent`.
   */
  header: [
    {
      nodeType: 'row',
      displayName: 'Header',
      props: {
        meta: {
          isHeader: true,
          role: 'header',
          headerLayout: 'standard',
          headerAlign: 'between',
        },
      },
      style_json: rowStyle({
        layout: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          gap: 18,
        },
        spacing: { padding: '14px 28px' },
        size: { minHeight: '72px' },
        background: { backgroundColor: '#ffffff' },
        effects: { boxShadow: '0 1px 0 rgba(15,23,42,0.08)' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Logo',
          style_json: columnStyle({
            layout: {
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: 'auto',
              alignItems: 'flex-start',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Logo stack',
              style_json: desktop({
                layout: { width: '100%', justifyContent: 'flex-start', alignItems: 'center' },
              }),
              children: [
                {
                  nodeType: 'image',
                  displayName: 'Logo',
                  props: {
                    src: 'https://via.placeholder.com/140x44?text=Logo',
                    alt: 'Company logo',
                  },
                  style_json: desktop({
                    size: { width: '180px', maxWidth: '100%', height: 'auto' },
                  }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Nav',
          style_json: columnStyle({
            layout: {
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '0%',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Nav stack',
              style_json: desktop({
                layout: {
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              }),
              children: [
                {
                  nodeType: 'menu',
                  displayName: 'Primary links',
                  props: {
                    variant: 'inline',
                    align: 'center',
                    items: [
                      { label: 'Home', to: '#' },
                      { label: 'About Us', to: '#' },
                      { label: 'Solutions', to: '#' },
                      { label: 'Blog', to: '#' },
                      { label: 'Contact Us', to: '#' },
                    ],
                  },
                  style_json: desktop({
                    typography: { fontSize: '14px', fontWeight: '600' },
                    colors: { textColor: 'var(--color-text)' },
                    menu: { gap: 14, itemPadding: '8px 6px' },
                  }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Actions',
          style_json: columnStyle({
            layout: {
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: 'auto',
              alignItems: 'flex-end',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Actions stack',
              style_json: {
                desktop: {
                  layout: {
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                  },
                },
                mobile: {
                  layout: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 10,
                  },
                },
              },
              children: [
                {
                  nodeType: 'button',
                  displayName: 'Login',
                  props: { text: 'Login' },
                  style_json: desktop({
                    spacing: { padding: '10px 16px' },
                    typography: { fontSize: '14px', fontWeight: '600' },
                    colors: { textColor: 'var(--color-text)', backgroundColor: 'transparent' },
                    border: { width: '1px', color: 'var(--color-border)', radius: '999px' },
                  }),
                },
                {
                  nodeType: 'button',
                  displayName: 'Get Started',
                  props: { text: 'Get Started' },
                  style_json: desktop({
                    spacing: { padding: '10px 16px' },
                    typography: { fontSize: '14px', fontWeight: '700' },
                    colors: { textColor: '#ffffff', backgroundColor: 'var(--color-primary)' },
                    border: { width: '0px', color: 'transparent', radius: '999px' },
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  hero: [
    {
      nodeType: 'row',
      displayName: 'Hero',
      style_json: rowStyle({
        layout: { gap: 24 },
        spacing: { padding: '48px 24px' },
        background: {
          backgroundColor: '#f1f5f9',
          backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          backgroundSize: 'cover',
        },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Hero column',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Hero stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' },
              }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Hero title',
                  props: { text: 'Hero Title' },
                  style_json: desktop({
                    typography: { fontSize: '40px', fontWeight: '700', lineHeight: '1.15' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Subtitle',
                  props: { text: 'Build responsive pages with sections, stacks, and live styles.' },
                  style_json: desktop({
                    typography: { fontSize: '18px', lineHeight: '1.5' },
                    colors: { textColor: '#475569' },
                  }),
                },
                {
                  nodeType: 'button',
                  displayName: 'Primary CTA',
                  props: { text: 'Get Started', href: '#' },
                  style_json: desktop({
                    spacing: { padding: '12px 24px' },
                    colors: { textColor: '#ffffff', backgroundColor: '#4f46e5' },
                    border: { radius: '10px' },
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  features: [
    {
      nodeType: 'row',
      displayName: 'Features',
      style_json: rowStyle({
        layout: { gap: 20 },
        spacing: { padding: '32px 16px' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Feature 1',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 8, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Feature 1',
                  props: { text: 'Feature 1' },
                  style_json: desktop({ typography: { fontSize: '22px', fontWeight: '600' } }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Body',
                  props: { text: 'Short supporting copy for this feature.' },
                  style_json: desktop({ typography: { fontSize: '15px' }, colors: { textColor: '#64748b' } }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Feature 2',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 8, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Feature 2',
                  props: { text: 'Feature 2' },
                  style_json: desktop({ typography: { fontSize: '22px', fontWeight: '600' } }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Body',
                  props: { text: 'Explain the benefit in one or two sentences.' },
                  style_json: desktop({ typography: { fontSize: '15px' }, colors: { textColor: '#64748b' } }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  /** Slim top bar: logo + inline menu + primary CTA (valid hierarchy, no nested stacks). */
  navbar: [
    {
      nodeType: 'row',
      displayName: 'Navbar',
      style_json: rowStyle({
        layout: { gap: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        spacing: { padding: '12px 20px' },
        background: { backgroundColor: '#0f172a' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Brand',
          style_json: columnStyle({ size: { width: '28%' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Logo stack',
              style_json: desktop({
                layout: { flexDirection: 'row', alignItems: 'center', gap: 12 },
              }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Brand',
                  props: { text: 'Brand' },
                  style_json: desktop({
                    typography: { fontSize: '20px', fontWeight: '700' },
                    colors: { textColor: '#f8fafc' },
                  }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Nav',
          style_json: columnStyle({ size: { width: '72%' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Nav stack',
              style_json: desktop({
                layout: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
              }),
              children: [
                {
                  nodeType: 'menu',
                  displayName: 'Links',
                  props: {
                    variant: 'underline',
                    align: 'right',
                    items: [
                      { label: 'Product', href: '#' },
                      { label: 'Pricing', href: '#' },
                      { label: 'Docs', href: '#' },
                    ],
                  },
                  style_json: desktop({
                    typography: { fontSize: '14px', fontWeight: '500' },
                    colors: { textColor: '#e2e8f0' },
                    menu: { gap: 16, itemPadding: '6px 4px' },
                  }),
                },
                {
                  nodeType: 'button',
                  displayName: 'Sign up',
                  props: { text: 'Sign up', href: '#' },
                  style_json: desktop({
                    spacing: { padding: '8px 16px' },
                    typography: { fontWeight: '600' },
                    colors: { textColor: '#0f172a', backgroundColor: '#f8fafc' },
                    border: { radius: '8px' },
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  footer: [
    {
      nodeType: 'row',
      displayName: 'Footer',
      style_json: rowStyle({
        layout: { gap: 24, justifyContent: 'space-between' },
        spacing: { padding: '40px 24px 32px' },
        background: { backgroundColor: '#0f172a' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Col A',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Title',
                  props: { text: 'Company' },
                  style_json: desktop({ typography: { fontSize: '16px', fontWeight: '700' }, colors: { textColor: '#f1f5f9' } }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Blurb',
                  props: { text: 'Short mission line or address.' },
                  style_json: desktop({ typography: { fontSize: '14px' }, colors: { textColor: '#94a3b8' } }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Col B',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 8, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Links',
                  props: { text: 'Explore' },
                  style_json: desktop({ typography: { fontSize: '16px', fontWeight: '700' }, colors: { textColor: '#f1f5f9' } }),
                },
                {
                  nodeType: 'menu',
                  displayName: 'Footer menu',
                  props: {
                    variant: 'inline',
                    align: 'left',
                    items: [
                      { label: 'Privacy', href: '#' },
                      { label: 'Terms', href: '#' },
                      { label: 'Contact', href: '#' },
                    ],
                  },
                  style_json: desktop({
                    typography: { fontSize: '14px' },
                    colors: { textColor: '#cbd5e1' },
                    menu: { gap: 8 },
                  }),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Col C',
          style_json: columnStyle({}),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({ layout: { gap: 8 } }),
              children: [
                {
                  nodeType: 'text',
                  displayName: 'Copyright',
                  props: { text: '© 2026 All rights reserved.' },
                  style_json: desktop({ typography: { fontSize: '13px' }, colors: { textColor: '#64748b' } }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  cta: [
    {
      nodeType: 'row',
      displayName: 'CTA',
      style_json: rowStyle({
        layout: { gap: 16, justifyContent: 'center' },
        spacing: { padding: '48px 24px' },
        background: {
          backgroundColor: '#312e81',
          backgroundImage: 'linear-gradient(120deg, #4338ca 0%, #6366f1 100%)',
          backgroundSize: 'cover',
        },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '640px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 16, alignItems: 'center' },
              }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Headline',
                  props: { text: 'Ready to ship faster?' },
                  style_json: desktop({
                    typography: { fontSize: '32px', fontWeight: '800', textAlign: 'center' },
                    colors: { textColor: '#ffffff' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Sub',
                  props: { text: 'Start from a template, tune responsive styles, publish when you are happy.' },
                  style_json: desktop({
                    typography: { fontSize: '16px', lineHeight: '1.55', textAlign: 'center' },
                    colors: { textColor: 'rgba(255,255,255,0.88)' },
                  }),
                },
                {
                  nodeType: 'button',
                  displayName: 'CTA',
                  props: { text: 'Get started', href: '#' },
                  style_json: desktop({
                    spacing: { padding: '14px 28px' },
                    typography: { fontWeight: '700' },
                    colors: { textColor: '#312e81', backgroundColor: '#ffffff' },
                    border: { radius: '999px' },
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Flat DFS list for `POST /api/pages/:pageId/nodes/bulk` (parents before children).
 * @param {number|null|undefined} rootPositionIndex — insert index for first root only
 */
export function flattenTemplateToBulkNodes(templateRoots, rootPositionIndex = null) {
  const out = [];
  let seq = 0;
  function walk(node, parentTempId, childIndex) {
    const tempId = `t${seq}`;
    seq += 1;
    const row = {
      tempId,
      nodeType: node.nodeType,
      displayName: node.displayName || node.nodeType,
      positionIndex: childIndex,
    };
    if (parentTempId != null) row.parentRef = parentTempId;
    if (node.props) row.props = node.props;
    if (node.style_json) row.style_json = node.style_json;
    out.push(row);
    (node.children || []).forEach((ch, i) => walk(ch, tempId, i));
  }
  templateRoots.forEach((root, rIdx) => {
    const pos =
      rIdx === 0 && rootPositionIndex != null && Number.isFinite(Number(rootPositionIndex))
        ? Number(rootPositionIndex)
        : rIdx;
    walk(root, null, pos);
  });
  return out;
}

/**
 * @param {object[]} templateRoots
 * @param {{ bulkCreateNodesRequest?: (nodes: object[]) => Promise<{ tree?: unknown, rootIds?: number[] }>, createNodeRequest: (p: object) => Promise<{ id?: number }>, positionIndex?: number|null }} ctx
 * @returns {Promise<number[]>} created root node ids
 */
export async function materializeSectionTemplate(templateRoots, ctx) {
  if (!Array.isArray(templateRoots) || !templateRoots.length) {
    throw new Error('Template has no roots');
  }
  const { bulkCreateNodesRequest, createNodeRequest, positionIndex = null } = ctx;
  if (typeof bulkCreateNodesRequest === 'function') {
    const nodes = flattenTemplateToBulkNodes(templateRoots, positionIndex);
    const data = await bulkCreateNodesRequest(nodes);
    return Array.isArray(data?.rootIds) ? data.rootIds : [];
  }
  if (typeof createNodeRequest !== 'function') {
    throw new Error('createNodeRequest is required');
  }

  async function createRecursive(templateNode, parentNodeId, childIndex) {
    const created = await createNodeRequest({
      nodeType: templateNode.nodeType,
      parentNodeId: parentNodeId ?? undefined,
      displayName: templateNode.displayName || templateNode.nodeType,
      props: templateNode.props,
      style_json: templateNode.style_json,
      positionIndex: childIndex,
    });
    const id = created?.id;
    if (!id) throw new Error(`Failed to create node: ${templateNode.nodeType}`);
    const kids = templateNode.children || [];
    for (let i = 0; i < kids.length; i += 1) {
      await createRecursive(kids[i], id, i);
    }
    return id;
  }

  const rootIds = [];
  for (let r = 0; r < templateRoots.length; r += 1) {
    const idx =
      r === 0 && positionIndex != null && Number.isFinite(Number(positionIndex)) ? Number(positionIndex) : undefined;
    const rootId = await createRecursive(templateRoots[r], null, idx);
    rootIds.push(rootId);
  }
  return rootIds;
}
