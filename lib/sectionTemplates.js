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
          gap: 14,
        },
        spacing: { padding: '14px 24px' },
        size: { minHeight: '78px' },
        background: { backgroundColor: '#ffffff' },
        effects: { boxShadow: '0 10px 28px rgba(15,23,42,0.08)' },
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
                    size: { width: '156px', maxWidth: '100%', height: 'auto' },
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
                    variant: 'underline',
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
                    typography: { fontSize: '14px', fontWeight: '650' },
                    colors: { textColor: '#0f172a' },
                    menu: { gap: 18, itemPadding: '10px 8px' },
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
                    border: { width: '1px', color: 'rgba(15,23,42,0.14)', radius: '999px' },
                  }),
                },
                {
                  nodeType: 'button',
                  displayName: 'Get Started',
                  props: { text: 'Get Started' },
                  style_json: desktop({
                    spacing: { padding: '10px 18px' },
                    typography: { fontSize: '14px', fontWeight: '700' },
                    colors: { textColor: '#ffffff', backgroundColor: '#4f46e5' },
                    border: { width: '0px', color: 'transparent', radius: '999px' },
                    effects: { boxShadow: '0 12px 26px rgba(79,70,229,0.28)' },
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
        layout: { gap: 28, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: {
          backgroundColor: '#0b1220',
          backgroundImage:
            'radial-gradient(900px 520px at 18% 22%, rgba(99,102,241,0.35) 0%, transparent 55%), radial-gradient(820px 520px at 70% 30%, rgba(34,211,238,0.22) 0%, transparent 60%), linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)',
          backgroundSize: 'cover',
        },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Hero content',
          style_json: columnStyle({ size: { width: '52%', maxWidth: '640px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Hero stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' },
              }),
              children: [
                {
                  nodeType: 'text',
                  displayName: 'Badge',
                  props: { text: 'New • Premium templates' },
                  style_json: desktop({
                    typography: { fontSize: '13px', fontWeight: '700' },
                    colors: { textColor: 'rgba(255,255,255,0.88)' },
                    border: { width: '1px', color: 'rgba(148,163,184,0.28)', radius: '999px' },
                    spacing: { padding: '8px 12px' },
                    background: { backgroundColor: 'rgba(255,255,255,0.06)' },
                  }),
                },
                {
                  nodeType: 'heading',
                  displayName: 'Hero title',
                  props: { text: 'Build production‑grade pages in minutes.' },
                  style_json: desktop({
                    typography: { fontSize: '54px', fontWeight: '850', lineHeight: '1.05' },
                    colors: { textColor: '#ffffff' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Subtitle',
                  props: { text: 'Premium sections with a consistent design system—responsive by default, easy to customize, and ready to ship.' },
                  style_json: desktop({
                    typography: { fontSize: '18px', lineHeight: '1.6' },
                    colors: { textColor: 'rgba(226,232,240,0.88)' },
                  }),
                },
                {
                  nodeType: 'stack',
                  displayName: 'CTA row',
                  style_json: desktop({ layout: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' } }),
                  children: [
                    {
                      nodeType: 'button',
                      displayName: 'Primary CTA',
                      props: { text: 'Get started', href: '#' },
                      style_json: desktop({
                        spacing: { padding: '12px 18px' },
                        typography: { fontSize: '14px', fontWeight: '800' },
                        colors: { textColor: '#0b1220', backgroundColor: '#ffffff' },
                        border: { radius: '12px' },
                        effects: { boxShadow: '0 16px 34px rgba(0,0,0,0.28)' },
                      }),
                    },
                    {
                      nodeType: 'button',
                      displayName: 'Secondary CTA',
                      props: { text: 'View templates', href: '#' },
                      style_json: desktop({
                        spacing: { padding: '12px 18px' },
                        typography: { fontSize: '14px', fontWeight: '800' },
                        colors: { textColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.08)' },
                        border: { width: '1px', color: 'rgba(148,163,184,0.28)', radius: '12px' },
                      }),
                    },
                  ],
                },
                {
                  nodeType: 'row',
                  displayName: 'Trust + stats',
                  style_json: rowStyle({
                    layout: { gap: 12, justifyContent: 'flex-start', alignItems: 'stretch' },
                    spacing: { padding: '10px 0px 0px' },
                  }),
                  children: [
                    {
                      nodeType: 'column',
                      displayName: 'Metric 1',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Metric stack',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 4 },
                            spacing: { padding: '12px' },
                            border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                            background: { backgroundColor: 'rgba(255,255,255,0.05)' },
                          }),
                          children: [
                            {
                              nodeType: 'heading',
                              displayName: 'Value',
                              props: { text: '2.4×' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Label',
                              props: { text: 'Faster launch' },
                              style_json: desktop({ typography: { fontSize: '12px' }, colors: { textColor: 'rgba(226,232,240,0.78)' } }),
                            },
                          ],
                        },
                      ],
                    },
                    {
                      nodeType: 'column',
                      displayName: 'Metric 2',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Metric stack',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 4 },
                            spacing: { padding: '12px' },
                            border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                            background: { backgroundColor: 'rgba(255,255,255,0.05)' },
                          }),
                          children: [
                            {
                              nodeType: 'heading',
                              displayName: 'Value',
                              props: { text: '99.9%' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Label',
                              props: { text: 'Layout stability' },
                              style_json: desktop({ typography: { fontSize: '12px' }, colors: { textColor: 'rgba(226,232,240,0.78)' } }),
                            },
                          ],
                        },
                      ],
                    },
                    {
                      nodeType: 'column',
                      displayName: 'Metric 3',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Metric stack',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 4 },
                            spacing: { padding: '12px' },
                            border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                            background: { backgroundColor: 'rgba(255,255,255,0.05)' },
                          }),
                          children: [
                            {
                              nodeType: 'heading',
                              displayName: 'Value',
                              props: { text: '12+' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Label',
                              props: { text: 'Premium sections' },
                              style_json: desktop({ typography: { fontSize: '12px' }, colors: { textColor: 'rgba(226,232,240,0.78)' } }),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Hero visual',
          style_json: columnStyle({ size: { width: '48%', maxWidth: '720px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Visual stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                spacing: { padding: '12px' },
                border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '18px' },
                background: { backgroundColor: 'rgba(255,255,255,0.06)' },
                effects: { boxShadow: '0 30px 70px rgba(0,0,0,0.40)' },
              }),
              children: [
                {
                  nodeType: 'image',
                  displayName: 'Dashboard preview',
                  props: {
                    src: 'https://via.placeholder.com/1200x760?text=Dashboard+Preview',
                    alt: 'Product dashboard preview',
                    imageFit: 'cover',
                    imageHeightPx: 360,
                  },
                  style_json: desktop({
                    border: { radius: '14px' },
                  }),
                },
                {
                  nodeType: 'row',
                  displayName: 'Floating cards row',
                  style_json: rowStyle({
                    layout: { gap: 10, justifyContent: 'space-between', alignItems: 'stretch' },
                  }),
                  children: [
                    {
                      nodeType: 'column',
                      displayName: 'Card A',
                      style_json: columnStyle({ size: { width: '50%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Glass card A',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 4 },
                            spacing: { padding: '12px' },
                            border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                            background: { backgroundColor: 'rgba(255,255,255,0.08)' },
                          }),
                          children: [
                            { nodeType: 'text', displayName: 'Label', props: { text: 'Conversion' }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '700' }, colors: { textColor: 'rgba(226,232,240,0.82)' } }) },
                            { nodeType: 'heading', displayName: 'Value', props: { text: '+18.2%' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }) },
                          ],
                        },
                      ],
                    },
                    {
                      nodeType: 'column',
                      displayName: 'Card B',
                      style_json: columnStyle({ size: { width: '50%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Glass card B',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 4 },
                            spacing: { padding: '12px' },
                            border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                            background: { backgroundColor: 'rgba(255,255,255,0.08)' },
                          }),
                          children: [
                            { nodeType: 'text', displayName: 'Label', props: { text: 'Latency' }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '700' }, colors: { textColor: 'rgba(226,232,240,0.82)' } }) },
                            { nodeType: 'heading', displayName: 'Value', props: { text: '112ms' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }) },
                          ],
                        },
                      ],
                    },
                  ],
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
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: '#ffffff' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Features column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Features stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 18, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Features title',
                  props: { text: 'Everything you need to ship faster' },
                  style_json: desktop({
                    typography: { fontSize: '34px', fontWeight: '900', textAlign: 'center', lineHeight: '1.1' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Features subtitle',
                  props: { text: 'A consistent design system with responsive, production-ready sections and polished components.' },
                  style_json: desktop({
                    typography: { fontSize: '16px', lineHeight: '1.6', textAlign: 'center' },
                    colors: { textColor: '#64748b' },
                  }),
                },
                {
                  nodeType: 'row',
                  displayName: 'Features grid',
                  style_json: rowStyle({
                    layout: { gap: 14, justifyContent: 'space-between', alignItems: 'stretch' },
                    spacing: { padding: '14px 0px 0px' },
                  }),
                  children: [
                    {
                      nodeType: 'column',
                      displayName: 'Feature A',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Card',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                            spacing: { padding: '18px' },
                            border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                            background: {
                              backgroundColor: '#ffffff',
                              backgroundImage: 'linear-gradient(180deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,0) 55%)',
                            },
                            effects: { boxShadow: '0 18px 42px rgba(15,23,42,0.08)' },
                          }),
                          children: [
                            {
                              nodeType: 'text',
                              displayName: 'Kicker',
                              props: { text: 'Design system' },
                              style_json: desktop({
                                typography: { fontSize: '12px', fontWeight: '800' },
                                colors: { textColor: '#4f46e5' },
                              }),
                            },
                            {
                              nodeType: 'heading',
                              displayName: 'Title',
                              props: { text: 'Consistent by default' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#0f172a' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Body',
                              props: { text: 'Unified spacing, radius, and typography so everything feels premium together.' },
                              style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.6' }, colors: { textColor: '#64748b' } }),
                            },
                          ],
                        },
                      ],
                    },
                    {
                      nodeType: 'column',
                      displayName: 'Feature B',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Card',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                            spacing: { padding: '18px' },
                            border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                            background: { backgroundColor: '#ffffff' },
                            effects: { boxShadow: '0 18px 42px rgba(15,23,42,0.08)' },
                          }),
                          children: [
                            {
                              nodeType: 'text',
                              displayName: 'Kicker',
                              props: { text: 'Responsive' },
                              style_json: desktop({
                                typography: { fontSize: '12px', fontWeight: '800' },
                                colors: { textColor: '#0ea5e9' },
                              }),
                            },
                            {
                              nodeType: 'heading',
                              displayName: 'Title',
                              props: { text: 'Override-only breakpoints' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Body',
                              props: { text: 'Desktop is the base, tablet/mobile only override what you change.' },
                              style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.6' }, colors: { textColor: '#64748b' } }),
                            },
                          ],
                        },
                      ],
                    },
                    {
                      nodeType: 'column',
                      displayName: 'Feature C',
                      style_json: columnStyle({ size: { width: '33.33%' } }),
                      children: [
                        {
                          nodeType: 'stack',
                          displayName: 'Card',
                          style_json: desktop({
                            layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                            spacing: { padding: '18px' },
                            border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                            background: {
                              backgroundColor: '#ffffff',
                              backgroundImage: 'linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(255,255,255,0) 55%)',
                            },
                            effects: { boxShadow: '0 18px 42px rgba(15,23,42,0.08)' },
                          }),
                          children: [
                            {
                              nodeType: 'text',
                              displayName: 'Kicker',
                              props: { text: 'Production ready' },
                              style_json: desktop({
                                typography: { fontSize: '12px', fontWeight: '800' },
                                colors: { textColor: '#0891b2' },
                              }),
                            },
                            {
                              nodeType: 'heading',
                              displayName: 'Title',
                              props: { text: 'Polished components' },
                              style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' } }),
                            },
                            {
                              nodeType: 'text',
                              displayName: 'Body',
                              props: { text: 'Buttons, cards, pricing, FAQ—built to feel like a real product.' },
                              style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.6' }, colors: { textColor: '#64748b' } }),
                            },
                          ],
                        },
                      ],
                    },
                  ],
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

  cards: [
    {
      nodeType: 'row',
      displayName: 'Cards',
      style_json: rowStyle({
        layout: { gap: 18 },
        spacing: { padding: '42px 24px' },
        background: { backgroundColor: '#ffffff' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Cards column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '980px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Cards stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 18, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Cards title',
                  props: { text: 'Explore what you can build' },
                  style_json: desktop({
                    typography: { fontSize: '28px', fontWeight: '800', textAlign: 'center' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Cards subtitle',
                  props: { text: 'A clean card grid that’s easy to customize across breakpoints.' },
                  style_json: desktop({
                    typography: { fontSize: '15px', lineHeight: '1.55', textAlign: 'center' },
                    colors: { textColor: '#64748b' },
                  }),
                },
                {
                  nodeType: 'row',
                  displayName: 'Cards grid row',
                  style_json: rowStyle({
                    layout: { gap: 14, justifyContent: 'space-between', alignItems: 'stretch' },
                    spacing: { padding: '10px 0px 0px' },
                  }),
                  children: [1, 2, 3].map((n) => ({
                    nodeType: 'column',
                    displayName: `Card ${n}`,
                    style_json: columnStyle({
                      size: { width: '33.33%' },
                    }),
                    children: [
                      {
                        nodeType: 'stack',
                        displayName: `Card ${n} stack`,
                        style_json: desktop({
                          layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                          spacing: { padding: '16px' },
                          border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '14px' },
                          background: { backgroundColor: '#ffffff' },
                          effects: { boxShadow: '0 10px 24px rgba(15,23,42,0.06)' },
                        }),
                        children: [
                          {
                            nodeType: 'image',
                            displayName: `Card ${n} image`,
                            props: {
                              src: `https://via.placeholder.com/640x360?text=Card+${n}`,
                              alt: `Card ${n}`,
                              imageFit: 'cover',
                              imageHeightPx: 140,
                            },
                            style_json: desktop({
                              border: { radius: '12px' },
                            }),
                          },
                          {
                            nodeType: 'heading',
                            displayName: `Card ${n} title`,
                            props: { text: `Card headline ${n}` },
                            style_json: desktop({ typography: { fontSize: '16px', fontWeight: '800' } }),
                          },
                          {
                            nodeType: 'text',
                            displayName: `Card ${n} body`,
                            props: { text: 'Short supporting copy for the card content.' },
                            style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.5' }, colors: { textColor: '#64748b' } }),
                          },
                          {
                            nodeType: 'button',
                            displayName: `Card ${n} button`,
                            props: { text: 'Learn more', href: '#' },
                            style_json: desktop({
                              spacing: { padding: '10px 14px' },
                              typography: { fontSize: '13px', fontWeight: '800' },
                              colors: { textColor: '#ffffff', backgroundColor: 'var(--color-primary)' },
                              border: { radius: '10px' },
                            }),
                          },
                        ],
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  testimonials: [
    {
      nodeType: 'row',
      displayName: 'Testimonials',
      style_json: rowStyle({
        layout: { gap: 18 },
        spacing: { padding: '44px 24px' },
        background: { backgroundColor: '#f8fafc' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Testimonials column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '980px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Testimonials stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Testimonials title',
                  props: { text: 'Loved by teams' },
                  style_json: desktop({
                    typography: { fontSize: '28px', fontWeight: '900', textAlign: 'center' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'row',
                  displayName: 'Testimonials row',
                  style_json: rowStyle({ layout: { gap: 14, alignItems: 'stretch' } }),
                  children: [1, 2].map((n) => ({
                    nodeType: 'column',
                    displayName: `Testimonial ${n}`,
                    style_json: columnStyle({ size: { width: '50%' } }),
                    children: [
                      {
                        nodeType: 'stack',
                        displayName: `Testimonial ${n} stack`,
                        style_json: desktop({
                          layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                          spacing: { padding: '16px' },
                          border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '14px' },
                          background: { backgroundColor: '#ffffff' },
                        }),
                        children: [
                          {
                            nodeType: 'text',
                            displayName: `Quote ${n}`,
                            props: { text: '“This template system is fast, flexible, and looks great out of the box.”' },
                            style_json: desktop({
                              typography: { fontSize: '14px', lineHeight: '1.6' },
                              colors: { textColor: '#0f172a' },
                            }),
                          },
                          {
                            nodeType: 'text',
                            displayName: `Author ${n}`,
                            props: { text: '— Alex, Product Lead' },
                            style_json: desktop({
                              typography: { fontSize: '13px', fontWeight: '700' },
                              colors: { textColor: '#475569' },
                            }),
                          },
                        ],
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  pricing: [
    {
      nodeType: 'row',
      displayName: 'Pricing',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '48px 24px' },
        background: { backgroundColor: '#ffffff' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Pricing column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '980px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Pricing stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'Pricing title',
                  props: { text: 'Simple pricing' },
                  style_json: desktop({
                    typography: { fontSize: '28px', fontWeight: '900', textAlign: 'center' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'row',
                  displayName: 'Plans row',
                  style_json: rowStyle({ layout: { gap: 14, alignItems: 'stretch' } }),
                  children: [
                    { name: 'Starter', price: '$19', accent: false },
                    { name: 'Pro', price: '$49', accent: true },
                    { name: 'Business', price: '$99', accent: false },
                  ].map((p) => ({
                    nodeType: 'column',
                    displayName: `${p.name} plan`,
                    style_json: columnStyle({ size: { width: '33.33%' } }),
                    children: [
                      {
                        nodeType: 'stack',
                        displayName: `${p.name} stack`,
                        style_json: desktop({
                          layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
                          spacing: { padding: '16px' },
                          border: { width: '1px', color: p.accent ? 'rgba(79,70,229,0.35)' : 'rgba(15,23,42,0.10)', radius: '14px' },
                          background: { backgroundColor: p.accent ? 'rgba(79,70,229,0.06)' : '#ffffff' },
                        }),
                        children: [
                          {
                            nodeType: 'heading',
                            displayName: `${p.name} name`,
                            props: { text: p.name },
                            style_json: desktop({ typography: { fontSize: '16px', fontWeight: '900' } }),
                          },
                          {
                            nodeType: 'heading',
                            displayName: `${p.name} price`,
                            props: { text: p.price },
                            style_json: desktop({ typography: { fontSize: '28px', fontWeight: '900' } }),
                          },
                          {
                            nodeType: 'text',
                            displayName: `${p.name} blurb`,
                            props: { text: 'Everything you need to start shipping faster.' },
                            style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.5' }, colors: { textColor: '#64748b' } }),
                          },
                          {
                            nodeType: 'button',
                            displayName: `${p.name} button`,
                            props: { text: 'Choose plan', href: '#' },
                            style_json: desktop({
                              spacing: { padding: '10px 14px' },
                              typography: { fontSize: '13px', fontWeight: '800' },
                              colors: { textColor: '#ffffff', backgroundColor: p.accent ? '#4f46e5' : 'var(--color-primary)' },
                              border: { radius: '10px' },
                            }),
                          },
                        ],
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  faq: [
    {
      nodeType: 'row',
      displayName: 'FAQ',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '44px 24px' },
        background: { backgroundColor: '#f8fafc' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'FAQ column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '860px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'FAQ stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 12, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'FAQ title',
                  props: { text: 'Frequently asked questions' },
                  style_json: desktop({
                    typography: { fontSize: '26px', fontWeight: '900', textAlign: 'center' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                ...[
                  { q: 'Can I edit everything?', a: 'Yes—styles and content are fully editable per breakpoint.' },
                  { q: 'Are templates responsive?', a: 'They use responsive override-only style layers (desktop/tablet/mobile).' },
                  { q: 'Do templates affect publishing?', a: 'No. Templates are just node-tree snapshots inserted into your draft.' },
                ].map((item, idx) => ({
                  nodeType: 'stack',
                  displayName: `FAQ item ${idx + 1}`,
                  style_json: desktop({
                    layout: { flexDirection: 'column', gap: 6, alignItems: 'stretch' },
                    spacing: { padding: '14px 14px' },
                    border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '14px' },
                    background: { backgroundColor: '#ffffff' },
                  }),
                  children: [
                    {
                      nodeType: 'heading',
                      displayName: `FAQ Q${idx + 1}`,
                      props: { text: item.q },
                      style_json: desktop({ typography: { fontSize: '15px', fontWeight: '900' } }),
                    },
                    {
                      nodeType: 'text',
                      displayName: `FAQ A${idx + 1}`,
                      props: { text: item.a },
                      style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.55' }, colors: { textColor: '#64748b' } }),
                    },
                  ],
                })),
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
