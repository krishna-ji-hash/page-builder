/**
 * Polished content trees for the 14 marketplace section templates.
 * Visual polish via styles/shared/template-sections.css + data-tpl-role hooks.
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import {
  applySectionItemsChildToDeviceStyle,
  applySectionLayoutToStyleJson,
  defaultSectionLayoutFor,
} from '@/lib/sectionLayout.js';
import { DEFAULT_STATS_COUNTER_ITEMS } from '@/lib/statsCounterDefaults.js';
import { DEFAULT_TAB_HERO_PANELS } from '@/lib/tabHeroDefaults.js';

const desktop = (patch) => ({ desktop: { ...patch } });
const rowMobileStack = { ...ROW_MOBILE_STACK_FRAGMENT };
const colMobileFull = { ...COLUMN_MOBILE_PATCH };

function columnStyle(desktopLayer = {}) {
  return {
    desktop: { ...desktopLayer, spacing: { padding: '0 0 24px', ...(desktopLayer.spacing || {}) } },
    ...colMobileFull,
  };
}

function rowStyle(desktopPatch) {
  return { ...rowMobileStack, desktop: { ...desktopPatch } };
}

export function sectionRowMeta(templateId, extraMeta = {}) {
  return {
    meta: {
      sectionTemplate: templateId,
      sectionLayout: defaultSectionLayoutFor(templateId),
      tplPolish: true,
      ...extraMeta,
    },
  };
}

function tplRole(role, extra = {}) {
  return { meta: { tplRole: role, ...extra } };
}

function itemsHost(extra = {}) {
  return { meta: { sectionItemsHost: true, tplRole: 'items-host', ...extra } };
}

function sectionHeader(title, subtitle) {
  return [
    {
      nodeType: 'heading',
      displayName: 'Section title',
      props: { text: title, tag: 'h2', ...tplRole('section-title').meta },
      style_json: desktop({
        typography: { fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.02em' },
        colors: { textColor: '#0f172a' },
      }),
    },
    subtitle
      ? {
          nodeType: 'text',
          displayName: 'Section subtitle',
          props: { text: subtitle, ...tplRole('section-subtitle').meta },
          style_json: desktop({
            typography: { fontSize: '17px', lineHeight: '1.65', fontWeight: '400' },
            colors: { textColor: '#64748b' },
          }),
        }
      : null,
  ].filter(Boolean);
}

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '$19',
    period: '/month',
    blurb: 'For solo sellers getting started with multi-carrier shipping.',
    features: '500 orders / mo\nEmail support\nStandard labels',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    blurb: 'Growing brands that need automation and branded tracking.',
    features: '5,000 orders / mo\nPriority support\nCOD reconciliation\nAPI access',
    popular: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: '/month',
    blurb: 'Teams with dedicated ops, SLAs, and advanced analytics.',
    features: 'Unlimited orders\nDedicated manager\nCustom contracts\nSSO & audit logs',
    popular: false,
  },
];

export function buildPricingSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Pricing',
    props: sectionRowMeta('pricing'),
    style_json: rowStyle({ spacing: { padding: '72px 24px 80px' }, background: { backgroundColor: '#f8fafc' } }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Pricing column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1100px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Pricing content',
            props: tplRole('section-inner'),
            style_json: desktop({ layout: { flexDirection: 'column', gap: 32, alignItems: 'stretch', width: '100%' } }),
            children: [
              ...sectionHeader('Plans that scale with your volume', 'Transparent pricing — no hidden per-label fees.'),
              {
                nodeType: 'stack',
                displayName: 'Plans row',
                props: itemsHost(),
                style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', width: '100%' } }),
                children: PRICING_PLANS.map((p) => ({
                  nodeType: 'stack',
                  displayName: `${p.name} plan`,
                  props: tplRole(p.popular ? 'pricing-card pricing-card--popular' : 'pricing-card'),
                  style_json: desktop({
                    layout: { flexDirection: 'column', gap: 12, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                    spacing: { padding: '28px 24px 24px' },
                    border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.08)' },
                    background: { backgroundColor: '#ffffff' },
                    effects: { boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' },
                  }),
                  children: [
                    ...(p.popular
                      ? [{
                          nodeType: 'text',
                          displayName: 'Popular badge',
                          props: { text: 'Most popular', ...tplRole('pricing-badge').meta },
                          style_json: desktop({
                            typography: { fontSize: '11px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' },
                            colors: { textColor: '#4f46e5' },
                          }),
                        }]
                      : []),
                    { nodeType: 'heading', displayName: `${p.name} name`, props: { text: p.name, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '800' }, colors: { textColor: '#0f172a' } }) },
                    {
                      nodeType: 'stack',
                      displayName: 'Price row',
                      props: tplRole('pricing-price'),
                      style_json: desktop({ layout: { flexDirection: 'row', gap: 4, alignItems: 'baseline', flexWrap: 'wrap' } }),
                      children: [
                        { nodeType: 'heading', displayName: 'Price', props: { text: p.price, tag: 'span' }, style_json: desktop({ typography: { fontSize: '40px', fontWeight: '900', lineHeight: '1' }, colors: { textColor: '#0f172a' } }) },
                        { nodeType: 'text', displayName: 'Period', props: { text: p.period }, style_json: desktop({ typography: { fontSize: '15px' }, colors: { textColor: '#94a3b8' } }) },
                      ],
                    },
                    { nodeType: 'text', displayName: 'Blurb', props: { text: p.blurb }, style_json: desktop({ typography: { fontSize: '14px', lineHeight: '1.55' }, colors: { textColor: '#64748b' } }) },
                    { nodeType: 'text', displayName: 'Features', props: { text: p.features }, style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }, colors: { textColor: '#475569' } }) },
                    {
                      nodeType: 'button',
                      displayName: 'CTA',
                      props: { text: p.popular ? 'Start with Pro' : 'Choose plan', href: '#' },
                      style_json: desktop({
                        spacing: { padding: '12px 18px', margin: { top: 8, bottom: 0, left: 0, right: 0 } },
                        typography: { fontSize: '14px', fontWeight: '800' },
                        colors: { textColor: '#ffffff', backgroundColor: p.popular ? '#4f46e5' : '#0f172a' },
                        border: { radius: '10px' },
                      }),
                    },
                  ],
                })),
              },
            ],
          },
        ],
      },
    ],
  };
}

export function buildStatsCounterSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Stats Counter',
    props: sectionRowMeta('stats'),
    style_json: rowStyle({ spacing: { padding: '56px 24px' }, background: { backgroundColor: '#ffffff' } }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Stats column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Stats wrapper',
            props: tplRole('stats-content-stack'),
            style_json: desktop({
              layout: { flexDirection: 'column', alignItems: 'center', width: '100%', gap: 24 },
            }),
            children: [
              ...sectionHeader('Our impact at scale', 'Trusted by logistics teams nationwide.'),
              {
                nodeType: 'stats_counter',
                displayName: 'Stats Counter',
                props: {
                  items: DEFAULT_STATS_COUNTER_ITEMS,
                  animate: true,
                  gapPx: 32,
                },
                style_json: desktop({ layout: { width: '100%' } }),
              },
            ],
          },
        ],
      },
    ],
  };
}

const CONTACT_FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'Your name', width: '100%' },
  { name: 'email', label: 'Work email', type: 'email', required: true, placeholder: 'you@company.com', width: '100%' },
  { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Tell us about your shipping volume…', width: '100%' },
];

export function buildGetInTouchSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Get in Touch',
    props: sectionRowMeta('getInTouch', { sectionColumnLayout: true }),
    style_json: rowStyle({
      layout: { gap: 0, alignItems: 'stretch', flexWrap: 'nowrap' },
      spacing: { padding: '0' },
      background: { backgroundColor: '#0f172a' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Contact band',
        props: tplRole('contact-band'),
        style_json: columnStyle({
          layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
          spacing: { padding: '56px clamp(20px, 4vw, 40px)' },
          background: { backgroundColor: '#0f172a' },
        }),
        children: [{
          nodeType: 'stack',
          displayName: 'Contact copy',
          props: tplRole('contact-band-inner'),
          style_json: desktop({
            layout: { flexDirection: 'column', gap: 18, alignItems: 'flex-start', justifyContent: 'center', minHeight: '100%' },
          }),
          children: [
            { nodeType: 'heading', displayName: 'Get in touch title', props: { text: 'Get in touch', tag: 'h2' }, style_json: desktop({ typography: { fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: '800', lineHeight: '1.12' }, colors: { textColor: 'var(--live-section-fg-on-dark, #f8fafc)' } }) },
            { nodeType: 'text', displayName: 'Get in touch intro', props: { text: 'Tell us about your shipping volume and we will tailor a plan for your team.' }, style_json: desktop({ typography: { fontSize: '16px', lineHeight: '1.65' }, colors: { textColor: 'var(--live-section-muted, #cbd5e1)' } }) },
            { nodeType: 'text', displayName: 'Email line', props: { text: '✉ contact@shipmozo.com' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '600' }, colors: { textColor: 'var(--live-section-fg-on-dark, #f8fafc)' } }) },
            { nodeType: 'text', displayName: 'Phone line', props: { text: '☎ +91 7375000072' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '600' }, colors: { textColor: 'var(--live-section-fg-on-dark, #f8fafc)' } }) },
          ],
        }],
      },
      {
        nodeType: 'column',
        displayName: 'Form column',
        props: tplRole('contact-form-col'),
        style_json: columnStyle({
          layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
          spacing: { padding: '48px clamp(20px, 4vw, 40px)' },
          background: { backgroundColor: '#f8fafc' },
        }),
        children: [{
          nodeType: 'stack',
          displayName: 'Form card',
          props: tplRole('form-card'),
          style_json: desktop({
            layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch', width: '100%' },
            spacing: { padding: '32px clamp(20px, 3vw, 36px)' },
            background: { backgroundColor: '#ffffff' },
            border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.06)' },
            effects: { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.1)' },
          }),
          children: [{
            nodeType: 'form',
            displayName: 'Get in touch form',
            props: { submitLabel: 'Send message', fields: CONTACT_FIELDS, layout: { labelGapPx: 10, inputAfterGapPx: 18, beforeSubmitGapPx: 24 } },
            style_json: desktop({ layout: { width: '100%' } }),
          }],
        }],
      },
    ],
  };
}

export function buildContactFormSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Contact Form',
    props: sectionRowMeta('contactForm', { sectionColumnLayout: true }),
    style_json: rowStyle({
      layout: { flexDirection: 'row', gap: 32, alignItems: 'stretch', flexWrap: 'nowrap', justifyContent: 'center' },
      spacing: { padding: '72px clamp(24px, 5vw, 48px)' },
      background: { backgroundColor: '#f1f5f9' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Contact info column',
        props: tplRole('contact-info'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Contact info',
          props: tplRole('contact-info-inner'),
          style_json: desktop({ layout: { flexDirection: 'column', gap: 18, alignItems: 'flex-start', justifyContent: 'center', minHeight: '100%' } }),
          children: [
            { nodeType: 'heading', displayName: 'Contact title', props: { text: 'Talk to our team', tag: 'h2' }, style_json: desktop({ typography: { fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: '800', lineHeight: '1.12' }, colors: { textColor: '#0f172a' } }) },
            { nodeType: 'text', displayName: 'Contact intro', props: { text: 'We respond within one business day. Share your monthly order volume for a tailored quote.' }, style_json: desktop({ typography: { fontSize: '16px', lineHeight: '1.65' }, colors: { textColor: '#64748b' } }) },
            { nodeType: 'text', displayName: 'Email', props: { text: '✉ contact@shipmozo.com' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '600' }, colors: { textColor: '#0f172a' } }) },
            { nodeType: 'text', displayName: 'Phone', props: { text: '☎ +91 7375000072' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '600' }, colors: { textColor: '#0f172a' } }) },
          ],
        }],
      },
      {
        nodeType: 'column',
        displayName: 'Form column',
        props: tplRole('contact-form-col'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Form card',
          props: tplRole('form-card'),
          style_json: desktop({
            layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch', width: '100%' },
            spacing: { padding: '32px clamp(24px, 3vw, 40px)' },
            background: { backgroundColor: '#ffffff' },
            border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.06)' },
            effects: { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.1)' },
          }),
          children: [{
            nodeType: 'form',
            displayName: 'Contact form',
            props: { submitLabel: 'Send message', fields: CONTACT_FIELDS, layout: { labelGapPx: 10, inputAfterGapPx: 18, beforeSubmitGapPx: 24 } },
            style_json: desktop({ layout: { width: '100%' } }),
          }],
        }],
      },
    ],
  };
}

const BLOG_POSTS = [
  { title: 'How to cut shipping costs in 2026', category: 'Logistics', date: 'Mar 12, 2026', excerpt: 'Rate shopping, packaging tips, and when to switch carriers mid-quarter.' },
  { title: 'COD reconciliation without spreadsheets', category: 'Operations', date: 'Feb 28, 2026', excerpt: 'Automate remittance matching and reduce chargeback disputes.' },
  { title: 'Scaling cross-border fulfillment', category: 'Growth', date: 'Feb 10, 2026', excerpt: 'DDP workflows, customs docs, and multi-carrier tracking in one dashboard.' },
];

export function buildBlogPreviewSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Blog Preview',
    props: sectionRowMeta('blogPreview'),
    style_json: rowStyle({ spacing: { padding: '72px 24px 80px' }, background: { backgroundColor: '#ffffff' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Blog column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Blog content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 32, alignItems: 'stretch', width: '100%' } }),
        children: [
          ...sectionHeader('Latest from the blog', 'Guides for operators, founders, and logistics teams.'),
          {
            nodeType: 'stack',
            displayName: 'Posts row',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'stretch', width: '100%' } }),
            children: BLOG_POSTS.map((post) => ({
              nodeType: 'stack',
              displayName: post.title,
              props: tplRole('blog-card'),
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', flex: '1 1 30%', minWidth: '280px', maxWidth: '100%' },
                border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.08)' },
                background: { backgroundColor: '#ffffff' },
                effects: { boxShadow: '0 10px 36px rgba(15, 23, 42, 0.07)' },
              }),
              children: [
                { nodeType: 'image', displayName: 'Cover', props: { src: '/builder-placeholder.svg', alt: post.title, imageFit: 'cover', imageHeightPx: 180 }, style_json: desktop({ size: { width: '100%' } }) },
                {
                  nodeType: 'stack',
                  displayName: 'Card body',
                  props: tplRole('card-body'),
                  style_json: desktop({ layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' }, spacing: { padding: '20px 22px 24px' } }),
                  children: [
                    { nodeType: 'text', displayName: 'Meta', props: { text: `${post.category} · ${post.date}` }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }, colors: { textColor: '#4f46e5' } }) },
                    { nodeType: 'heading', displayName: 'Title', props: { text: post.title, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '19px', fontWeight: '800', lineHeight: '1.3' }, colors: { textColor: '#0f172a' } }) },
                    { nodeType: 'text', displayName: 'Excerpt', props: { text: post.excerpt }, style_json: desktop({ typography: { fontSize: '14px', lineHeight: '1.6' }, colors: { textColor: '#64748b' } }) },
                    { nodeType: 'button', displayName: 'Read more', props: { text: 'Read article →', href: '#' }, style_json: desktop({ spacing: { padding: '0', margin: { top: 4, bottom: 0, left: 0, right: 0 } }, typography: { fontSize: '14px', fontWeight: '800' }, colors: { textColor: '#4f46e5', backgroundColor: 'transparent' }, border: { width: '0' } }) },
                  ],
                },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

const TIMELINE_STEPS = [
  { title: 'Order synced', date: 'Step 1', body: 'Checkout on your store or marketplace — inventory syncs automatically.' },
  { title: 'Courier assigned', date: 'Step 2', body: 'Best-rate carrier selected and pickup window confirmed.' },
  { title: 'Pickup & dispatch', date: 'Step 3', body: 'Live tracking, exceptions, and customer notifications.' },
  { title: 'Track & deliver', date: 'Step 4', body: 'ePOD, COD remittance, and analytics updated in real time.' },
];

export function buildTimelineSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Timeline',
    props: sectionRowMeta('timeline'),
    style_json: rowStyle({ spacing: { padding: '72px 24px' }, background: { backgroundColor: '#ffffff' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Timeline column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '800px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Timeline content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 28, alignItems: 'stretch', width: '100%' } }),
        children: [
          ...sectionHeader('How delivery unfolds', 'From checkout to proof of delivery.'),
          {
            nodeType: 'stack',
            displayName: 'Timeline steps',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', width: '100%' } }),
            children: TIMELINE_STEPS.map((step) => ({
              nodeType: 'stack',
              displayName: step.title,
              props: tplRole('timeline-step'),
              style_json: desktop({ layout: { flexDirection: 'row', gap: 18, alignItems: 'flex-start', width: '100%' }, spacing: { padding: '0 0 28px' } }),
              children: [
                {
                  nodeType: 'stack',
                  displayName: 'Dot column',
                  props: tplRole('timeline-rail'),
                  style_json: desktop({ layout: { flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', width: '32px' } }),
                  children: [{ nodeType: 'text', displayName: 'Dot', props: { text: '●' }, style_json: desktop({ typography: { fontSize: '18px', lineHeight: '1', textAlign: 'center' }, colors: { textColor: '#4f46e5' } }) }],
                },
                {
                  nodeType: 'stack',
                  displayName: 'Step copy',
                  props: tplRole('timeline-body'),
                  style_json: desktop({ layout: { flexDirection: 'column', gap: 6, flex: '1 1 0', minWidth: 0 } }),
                  children: [
                    { nodeType: 'text', displayName: 'Step date', props: { text: step.date }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }, colors: { textColor: '#4f46e5' } }) },
                    { nodeType: 'heading', displayName: 'Step title', props: { text: step.title, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '800' }, colors: { textColor: '#0f172a' } }) },
                    { nodeType: 'text', displayName: 'Step body', props: { text: step.body }, style_json: desktop({ typography: { fontSize: '15px', lineHeight: '1.6' }, colors: { textColor: '#64748b' } }) },
                  ],
                },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

const COMPARE_ROWS = [
  { label: 'Monthly shipments', values: ['500', '5,000', 'Unlimited'] },
  { label: 'Carrier accounts', values: ['3', '12', 'Custom'] },
  { label: 'COD remittance', values: ['✓', '✓', '✓'] },
  { label: 'Dedicated manager', values: ['—', '✓', '✓'] },
];

export function buildComparisonTableSectionRow() {
  const cell = (text, role) => ({
    nodeType: 'text',
    displayName: text,
    props: { text, ...tplRole(role).meta },
    style_json: desktop({ typography: { fontSize: '14px', fontWeight: role.includes('head') ? '800' : '500' }, colors: { textColor: '#0f172a' } }),
  });
  const tableRow = (cells, rowRole) => ({
    nodeType: 'stack',
    displayName: rowRole,
    props: tplRole(rowRole),
    style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'nowrap', width: '100%', minWidth: '520px' } }),
    children: cells.map((c, i) => ({
      nodeType: 'stack',
      displayName: c.text,
      props: tplRole(c.role),
      style_json: desktop({
        layout: { flex: i === 0 ? '1.3 1 0' : '1 1 0', minWidth: i === 0 ? '140px' : '100px' },
        spacing: { padding: '14px 16px' },
        background: { backgroundColor: c.role.includes('highlight') ? 'rgba(79,70,229,0.06)' : 'transparent' },
        border: { width: '0 0 1px 0', color: 'rgba(15,23,42,0.08)' },
      }),
      children: [cell(c.text, c.role)],
    })),
  });
  return {
    nodeType: 'row',
    displayName: 'Comparison Table',
    props: sectionRowMeta('comparisonTable'),
    style_json: rowStyle({ spacing: { padding: '72px 24px' }, background: { backgroundColor: '#f8fafc' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Comparison column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '960px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Comparison content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 24, alignItems: 'stretch', width: '100%' } }),
        children: [
          ...sectionHeader('Compare plans', 'Swipe on mobile to see all columns.'),
          {
            nodeType: 'stack',
            displayName: 'Table',
            props: itemsHost({ tplRole: 'compare-table' }),
            style_json: desktop({
              layout: { flexDirection: 'column', gap: 0, width: '100%' },
              border: { radius: '14px', width: '1px', color: 'rgba(15,23,42,0.1)' },
              background: { backgroundColor: '#ffffff' },
              effects: { boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' },
            }),
            children: [
              tableRow(
                [
                  { text: 'Feature', role: 'compare-head' },
                  { text: 'Starter', role: 'compare-head' },
                  { text: 'Pro', role: 'compare-head compare-col-highlight' },
                  { text: 'Business', role: 'compare-head' },
                ],
                'compare-header'
              ),
              ...COMPARE_ROWS.map((r, idx) =>
                tableRow(
                  [
                    { text: r.label, role: 'compare-feature' },
                    ...r.values.map((v, i) => ({ text: v, role: i === 1 ? 'compare-cell compare-col-highlight' : 'compare-cell' })),
                  ],
                  `compare-row-${idx}`
                )
              ),
            ],
          },
        ],
      }],
    }],
  };
}

export function buildGallerySectionRow() {
  const images = [1, 2, 3, 4, 5, 6];
  const galleryLayout = defaultSectionLayoutFor('gallery');
  const galleryGridStyle = applySectionLayoutToStyleJson(desktop({ layout: { width: '100%' } }), galleryLayout);
  const galleryItemBase = desktop({
    layout: { flexDirection: 'column', overflow: 'hidden' },
    border: { radius: '14px' },
  });
  const galleryItemStyle = {
    ...galleryItemBase,
    desktop: applySectionItemsChildToDeviceStyle(galleryItemBase.desktop, galleryLayout, 'desktop'),
  };
  return {
    nodeType: 'row',
    displayName: 'Gallery',
    props: sectionRowMeta('gallery'),
    style_json: rowStyle({
      spacing: { padding: '72px 24px' },
      background: { backgroundColor: '#0f172a' },
      layout: { justifyContent: 'center' },
    }),
    children: [{
      nodeType: 'column',
      displayName: 'Gallery column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Gallery content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 28, alignItems: 'stretch', width: '100%' } }),
        children: [
          { nodeType: 'heading', displayName: 'Gallery title', props: { text: 'Warehouse & fleet gallery', tag: 'h2', ...tplRole('section-title').meta }, style_json: desktop({ typography: { fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: '800' }, colors: { textColor: '#ffffff' } }) },
          {
            nodeType: 'stack',
            displayName: 'Gallery grid',
            props: itemsHost(),
            style_json: galleryGridStyle,
            children: images.map((n) => ({
              nodeType: 'stack',
              displayName: `Gallery ${n}`,
              props: tplRole('gallery-item'),
              style_json: galleryItemStyle,
              children: [{
                nodeType: 'image',
                displayName: `Image ${n}`,
                props: { src: '/builder-placeholder.svg', alt: `Gallery image ${n}`, imageFit: 'cover', imageHeightPx: 200 },
                style_json: desktop({ size: { width: '100%' }, border: { radius: '14px' } }),
              }],
            })),
          },
        ],
      }],
    }],
  };
}

const TEAM_MEMBERS = [
  { name: 'Priya Sharma', role: 'CEO & Co-founder', bio: 'Former ops lead at a top-3 marketplace.', social: 'LinkedIn · Twitter' },
  { name: 'Rahul Mehta', role: 'Head of Operations', bio: '15 years in last-mile and hub network design.', social: 'LinkedIn' },
  { name: 'Ananya Das', role: 'Product Lead', bio: 'Built tracking & NDR products used by 2M+ sellers.', social: 'LinkedIn · GitHub' },
  { name: 'Vikram Singh', role: 'Customer Success', bio: 'Dedicated to onboarding and SLA excellence.', social: 'LinkedIn' },
];

export function buildTeamSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Team',
    props: sectionRowMeta('team'),
    style_json: rowStyle({ spacing: { padding: '72px 24px 80px' }, background: { backgroundColor: '#ffffff' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Team column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Team content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 32, alignItems: 'stretch', width: '100%' } }),
        children: [
          ...sectionHeader('Meet the team', 'Operators, engineers, and customer champions behind the platform.'),
          {
            nodeType: 'stack',
            displayName: 'Team grid',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', width: '100%' } }),
            children: TEAM_MEMBERS.map((m) => ({
              nodeType: 'stack',
              displayName: m.name,
              props: tplRole('team-card'),
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 12, alignItems: 'center', flex: '1 1 22%', minWidth: '220px', maxWidth: '100%' },
                spacing: { padding: '24px 20px' },
                border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.08)' },
                background: { backgroundColor: '#f8fafc' },
                effects: { boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)' },
              }),
              children: [
                { nodeType: 'image', displayName: 'Photo', props: { src: '/builder-placeholder.svg', alt: m.name, imageFit: 'cover', imageHeightPx: 120 }, style_json: desktop({ size: { width: '120px', height: '120px' }, border: { radius: '999px' } }) },
                { nodeType: 'heading', displayName: 'Name', props: { text: m.name, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '17px', fontWeight: '800', textAlign: 'center' }, colors: { textColor: '#0f172a' } }) },
                { nodeType: 'text', displayName: 'Role', props: { text: m.role }, style_json: desktop({ typography: { fontSize: '14px', fontWeight: '600', textAlign: 'center' }, colors: { textColor: '#4f46e5' } }) },
                { nodeType: 'text', displayName: 'Bio', props: { text: m.bio }, style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.55', textAlign: 'center' }, colors: { textColor: '#64748b' } }) },
                { nodeType: 'text', displayName: 'Social', props: { text: m.social }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '700', textAlign: 'center' }, colors: { textColor: '#94a3b8' } }) },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

export function buildVideoSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Video Section',
    props: sectionRowMeta('videoSection', { sectionColumnLayout: true }),
    style_json: rowStyle({ layout: { gap: 32, alignItems: 'center', flexWrap: 'nowrap' }, spacing: { padding: '72px 24px' }, background: { backgroundColor: '#0b1220' } }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Video copy column',
        props: tplRole('video-copy-col'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Video copy',
          props: tplRole('video-copy'),
          style_json: desktop({ layout: { flexDirection: 'column', gap: 16, alignItems: 'flex-start', justifyContent: 'center', minHeight: '100%' } }),
          children: [
            { nodeType: 'heading', displayName: 'Video title', props: { text: 'See the platform in action', tag: 'h2' }, style_json: desktop({ typography: { fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: '800', lineHeight: '1.12' }, colors: { textColor: '#ffffff' } }) },
            { nodeType: 'text', displayName: 'Video subtitle', props: { text: 'Watch a 2-minute walkthrough of booking, tracking, and COD — then paste your embed URL in the inspector.' }, style_json: desktop({ typography: { fontSize: '16px', lineHeight: '1.6' }, colors: { textColor: 'rgba(226,232,240,0.88)' } }) },
          ],
        }],
      },
      {
        nodeType: 'column',
        displayName: 'Video media column',
        props: tplRole('video-media-col'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Video embed card',
          props: tplRole('video-embed'),
          style_json: desktop({ layout: { flexDirection: 'column', width: '100%', position: 'relative' }, border: { radius: '16px', width: '1px', color: 'rgba(148,163,184,0.25)' }, effects: { boxShadow: '0 24px 48px rgba(0,0,0,0.35)' } }),
          children: [
            { nodeType: 'image', displayName: 'Video thumbnail', props: { src: '/builder-placeholder.svg', alt: 'Product demo video', imageFit: 'cover', imageHeightPx: 360 }, style_json: desktop({ size: { width: '100%' }, border: { radius: '16px' } }) },
            { nodeType: 'text', displayName: 'Play hint', props: { text: '▶', ...tplRole('video-play').meta }, style_json: desktop({ typography: { fontSize: '28px', fontWeight: '400', textAlign: 'center', lineHeight: '1' }, colors: { textColor: '#ffffff', backgroundColor: 'rgba(79,70,229,0.92)' }, spacing: { padding: '18px 22px' }, border: { radius: '999px' }, layout: { position: 'absolute' } }) },
          ],
        }],
      },
    ],
  };
}

const PROCESS_STEPS = [
  { n: '01', title: 'Connect store', body: 'Sync orders from Shopify, WooCommerce, or CSV.' },
  { n: '02', title: 'Book pickup', body: 'Compare rates and schedule pickup in one click.' },
  { n: '03', title: 'Track & notify', body: 'Branded tracking pages and proactive alerts.' },
  { n: '04', title: 'Analyze', body: 'Dashboards for SLA, COD, and carrier performance.' },
];

export function buildProcessStepsSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Process Steps',
    props: sectionRowMeta('processSteps'),
    style_json: rowStyle({ spacing: { padding: '72px 24px' }, background: { backgroundColor: '#f4f8fc' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Process column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Process content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 32, alignItems: 'stretch', width: '100%' } }),
        children: [
          ...sectionHeader('Four steps to go live', 'From first sync to daily dispatch in under a week.'),
          {
            nodeType: 'stack',
            displayName: 'Steps row',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch', width: '100%' } }),
            children: PROCESS_STEPS.map((s) => ({
              nodeType: 'stack',
              displayName: s.title,
              props: tplRole('process-step'),
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 10, flex: '1 1 22%', minWidth: '220px', maxWidth: '100%' },
                spacing: { padding: '22px 20px' },
                border: { radius: '14px', width: '1px', color: 'rgba(15,23,42,0.08)' },
                background: { backgroundColor: '#ffffff' },
                effects: { boxShadow: '0 10px 32px rgba(15, 23, 42, 0.06)' },
              }),
              children: [
                { nodeType: 'text', displayName: 'Step index', props: { text: s.n, ...tplRole('process-badge').meta }, style_json: desktop({ typography: { fontSize: '13px', fontWeight: '900', letterSpacing: '0.08em' }, colors: { textColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)' }, spacing: { padding: '6px 10px' }, border: { radius: '8px' }, size: { width: 'fit-content' } }) },
                { nodeType: 'heading', displayName: 'Step title', props: { text: s.title, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '800' }, colors: { textColor: '#0f172a' } }) },
                { nodeType: 'text', displayName: 'Step body', props: { text: s.body }, style_json: desktop({ typography: { fontSize: '14px', lineHeight: '1.55' }, colors: { textColor: '#64748b' } }) },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

const TRUST_BADGES = [
  { icon: '🔒', title: 'ISO 27001', sub: 'Information security' },
  { icon: '✓', title: 'SOC 2 Type II', sub: 'Audited controls' },
  { icon: '🛡', title: 'GDPR Ready', sub: 'Data protection' },
  { icon: '⚡', title: '99.9% Uptime', sub: 'Platform SLA' },
  { icon: '💳', title: 'PCI Compliant', sub: 'Payments safe' },
];

export function buildTrustBadgesSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Trust Badges',
    props: sectionRowMeta('trustBadges'),
    style_json: rowStyle({ spacing: { padding: '48px 24px' }, background: { backgroundColor: '#ffffff' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Trust badges column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Trust badges content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' } }),
        children: [
          { nodeType: 'text', displayName: 'Trust label', props: { text: 'Enterprise-grade security & reliability' }, style_json: desktop({ typography: { fontSize: '13px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }, colors: { textColor: '#64748b' } }) },
          {
            nodeType: 'stack',
            displayName: 'Badges row',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' } }),
            children: TRUST_BADGES.map((b) => ({
              nodeType: 'stack',
              displayName: b.title,
              props: tplRole('trust-badge'),
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 6, alignItems: 'center', flex: '1 1 160px', minWidth: '140px', maxWidth: '200px' },
                spacing: { padding: '16px 14px' },
                border: { radius: '12px', width: '1px', color: 'rgba(15,23,42,0.08)' },
                background: { backgroundColor: '#f8fafc' },
              }),
              children: [
                { nodeType: 'text', displayName: 'Icon', props: { text: b.icon }, style_json: desktop({ typography: { fontSize: '22px', lineHeight: '1', textAlign: 'center' } }) },
                { nodeType: 'text', displayName: 'Title', props: { text: b.title }, style_json: desktop({ typography: { fontSize: '13px', fontWeight: '800', textAlign: 'center' }, colors: { textColor: '#0f172a' } }) },
                { nodeType: 'text', displayName: 'Subtitle', props: { text: b.sub }, style_json: desktop({ typography: { fontSize: '11px', textAlign: 'center' }, colors: { textColor: '#94a3b8' } }) },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

export function buildTabHeroSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Tab Hero',
    props: sectionRowMeta('tabHero'),
    style_json: {
      ...rowStyle({
        layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
        spacing: { padding: '40px 24px 56px' },
        background: { backgroundColor: '#ffffff' },
      }),
      mobile: {
        spacing: { padding: '28px 16px 40px' },
      },
    },
    children: [
      {
        nodeType: 'column',
        displayName: 'Tab hero column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Tab hero host',
            props: tplRole('tab-hero-host'),
            style_json: desktop({
              layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', width: '100%' },
            }),
            children: [
              {
                nodeType: 'tab_hero',
                displayName: 'Tab Hero',
                props: {
                  activePanelId: DEFAULT_TAB_HERO_PANELS[0]?.id,
                  panels: DEFAULT_TAB_HERO_PANELS,
                  tabAlign: 'left',
                },
                style_json: {
                  desktop: { layout: { width: '100%' } },
                  mobile: { layout: { width: '100%', maxWidth: '100%' }, size: { width: '100%', maxWidth: '100%' } },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export function buildSplitHeroCarouselSectionRow() {
  const slides = [
    {
      id: 'shc-1',
      badge: 'New • Premium templates',
      title: 'Build production-grade pages in minutes.',
      body: 'Premium sections with a consistent design system—responsive by default, easy to customize, and ready to ship.',
      imageSrc:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Dashboard preview',
      cta: { label: 'Get started', href: '#' },
    },
    {
      id: 'shc-2',
      badge: 'Ship faster',
      title: 'Launch campaigns without waiting on dev.',
      body: 'Compose hero, pricing, FAQ, and CTA sections from the template library—then publish when you are ready.',
      imageSrc:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Analytics mockup',
      cta: { label: 'View templates', href: '#' },
    },
    {
      id: 'shc-3',
      badge: 'Design system',
      title: 'One theme. Readable everywhere.',
      body: 'Site-wide colors, typography, and contrast tokens keep copy legible in light mode, dark mode, and mixed sections.',
      imageSrc:
        'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
      imageAlt: 'Team collaboration',
      cta: { label: 'Explore theme', href: '#' },
    },
  ];
  return {
    nodeType: 'row',
    displayName: 'Split Hero Carousel',
    props: sectionRowMeta('splitHeroCarousel'),
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '48px 24px' },
      background: {
        backgroundImage:
          'radial-gradient(900px 520px at 18% 22%, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 55%), radial-gradient(820px 520px at 78% 30%, color-mix(in srgb, var(--color-secondary) 16%, transparent) 0%, transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--color-background) 92%, var(--color-primary) 8%) 0%, color-mix(in srgb, var(--color-background) 88%, var(--color-secondary) 12%) 100%)',
        backgroundSize: 'cover',
      },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Split hero column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1200px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Split hero host',
            props: tplRole('section-inner'),
            style_json: desktop({ layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', width: '100%' } }),
            children: [
              {
                nodeType: 'carousel',
                displayName: 'Split hero carousel',
                props: {
                  variant: 'splitHero',
                  transitionEffect: 'fade',
                  autoplay: true,
                  loop: true,
                  showArrows: true,
                  showDots: true,
                  speed: 620,
                  interval: 4500,
                  pauseOnHover: true,
                  imageFit: 'contain',
                  splitHeroVisualFrame: 'none',
                  splitHeroVisualShadow: 'none',
                  splitHeroVisualBorder: 'show',
                  splitHeroVisualBgColor: '',
                  splitHeroVisualBorderColor: '',
                  splitHeroVisualWidthPct: 40,
                  splitHeroImageMaxHeightPx: 300,
                  splitHeroImageScalePct: 100,
                  splitHeroVisualOffsetXPx: 0,
                  splitHeroVisualOffsetYPx: 0,
                  splitHeroNavOffsetXPx: 0,
                  splitHeroNavOffsetYPx: 0,
                  /** Optional cap on section shell height (px). Empty = use CSS clamp only. */
                  splitHeroSectionMinHeightPx: 0,
                  splitHeroSectionMaxHeightPx: '',
                  /** Row height (px) on the parent section — primary control for overall hero block height. */
                  sectionHeightPx: 560,
                  slidesPerView: { desktop: 1, tablet: 1, mobile: 1 },
                  slides,
                  settings: {
                    variant: 'splitHero',
                    transitionEffect: 'fade',
                    autoplay: true,
                    loop: true,
                    arrows: true,
                    dots: true,
                    speedMs: 620,
                    autoplayMs: 4500,
                    perView: { desktop: 1, tablet: 1, mobile: 1 },
                  },
                },
                style_json: desktop({ layout: { width: '100%' } }),
              },
            ],
          },
        ],
      },
    ],
  };
}

export function buildBrandsLogoSliderSectionRow() {
  const logoSlides = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    id: `brand-logo-${n}`,
    title: '',
    image: '/builder-placeholder.svg',
  }));
  return {
    nodeType: 'row',
    displayName: 'Brands Logo Slider',
    props: sectionRowMeta('brandsLogoSlider'),
    style_json: rowStyle({ spacing: { padding: '40px 0' }, background: { backgroundColor: '#ffffff' } }),
    children: [{
      nodeType: 'column',
      displayName: 'Logo slider column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '100%' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'Logo slider stack',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 14, alignItems: 'stretch', width: '100%' } }),
        children: [
          { nodeType: 'text', displayName: 'Slider label', props: { text: 'Trusted by leading brands' }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }, colors: { textColor: '#94a3b8' } }) },
          {
            nodeType: 'carousel',
            displayName: 'Brand logos',
            props: {
              variant: 'logo',
              slides: logoSlides,
              gap: 28,
              slidesPerView: { desktop: 4, tablet: 3, mobile: 1 },
              settings: { variant: 'logo', gapPx: 28, autoplay: true, loop: true, perView: { desktop: 4, tablet: 3, mobile: 1 } },
            },
            style_json: desktop({ layout: { width: '100%' }, spacing: { padding: '8px 24px' } }),
          },
        ],
      }],
    }],
  };
}

const WEB_STORIES = [
  { label: 'Pickup', color: '#4f46e5', text: 'Schedule pickups across 19K+ pincodes in seconds.' },
  { label: 'Tracking', color: '#0ea5e9', text: 'Branded tracking pages with proactive SMS & email.' },
  { label: 'COD', color: '#10b981', text: 'Reconcile remittance and reduce RTO with smart rules.' },
  { label: 'Returns', color: '#f59e0b', text: 'Reverse logistics with QC and auto-refund triggers.' },
  { label: 'Reports', color: '#ec4899', text: 'SLA, carrier scorecards, and finance-ready exports.' },
];

export function buildWebStorySectionRow() {
  return {
    nodeType: 'row',
    displayName: 'WebStory Section',
    props: sectionRowMeta('webStory'),
    style_json: rowStyle({ spacing: { padding: '56px 24px' }, background: { backgroundColor: '#0f172a' } }),
    children: [{
      nodeType: 'column',
      displayName: 'WebStory column',
      style_json: columnStyle({ size: { width: '100%', maxWidth: '1100px' } }),
      children: [{
        nodeType: 'stack',
        displayName: 'WebStory content',
        props: tplRole('section-inner'),
        style_json: desktop({ layout: { flexDirection: 'column', gap: 28, alignItems: 'stretch', width: '100%' } }),
        children: [
          { nodeType: 'heading', displayName: 'WebStory title', props: { text: 'Stories from the warehouse floor', tag: 'h2', ...tplRole('section-title').meta }, style_json: desktop({ typography: { fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: '800', textAlign: 'center' }, colors: { textColor: '#ffffff' } }) },
          {
            nodeType: 'stack',
            displayName: 'Stories row',
            props: itemsHost(),
            style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'stretch', width: '100%' } }),
            children: WEB_STORIES.map((s) => ({
              nodeType: 'stack',
              displayName: s.label,
              props: tplRole('story-card'),
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 12, alignItems: 'center', flex: '1 1 18%', minWidth: '160px', maxWidth: '220px' },
                spacing: { padding: '18px 14px' },
                border: { radius: '16px', width: '1px', color: 'rgba(255,255,255,0.12)' },
                background: { backgroundColor: 'rgba(255,255,255,0.06)' },
              }),
              children: [
                {
                  nodeType: 'image',
                  displayName: 'Story thumb',
                  props: { src: '/builder-placeholder.svg', alt: s.label, imageFit: 'cover', imageHeightPx: 64 },
                  style_json: desktop({ size: { width: '64px', height: '64px' }, border: { radius: '999px', width: '3px', color: s.color } }),
                },
                { nodeType: 'heading', displayName: 'Story title', props: { text: s.label, tag: 'h3' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '800', textAlign: 'center' }, colors: { textColor: '#ffffff' } }) },
                { nodeType: 'text', displayName: 'Story text', props: { text: s.text }, style_json: desktop({ typography: { fontSize: '12px', lineHeight: '1.5', textAlign: 'center' }, colors: { textColor: 'rgba(255,255,255,0.75)' } }) },
              ],
            })),
          },
        ],
      }],
    }],
  };
}

export function buildMapIntegrationSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Map Integration',
    props: sectionRowMeta('mapIntegration', { sectionColumnLayout: true }),
    style_json: rowStyle({ layout: { gap: 32, alignItems: 'stretch', flexWrap: 'nowrap' }, spacing: { padding: '72px 24px' }, background: { backgroundColor: '#ffffff' } }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Map visual',
        props: tplRole('map-visual-col'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Map card',
          props: tplRole('map-card'),
          style_json: desktop({ layout: { flexDirection: 'column', width: '100%', overflow: 'hidden' }, border: { radius: '16px', width: '1px', color: 'rgba(15,23,42,0.10)' }, effects: { boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' } }),
          children: [{
            nodeType: 'image',
            displayName: 'Map placeholder',
            props: { src: '/builder-placeholder.svg', alt: 'Office location map — replace with embed or map image', imageFit: 'cover', imageHeightPx: 360 },
            style_json: desktop({ size: { width: '100%' }, border: { radius: '16px' } }),
          }],
        }],
      },
      {
        nodeType: 'column',
        displayName: 'Map details',
        props: tplRole('map-details-col'),
        style_json: columnStyle({ layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } }),
        children: [{
          nodeType: 'stack',
          displayName: 'Map copy stack',
          props: tplRole('map-details'),
          style_json: desktop({ layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch', justifyContent: 'center', minHeight: '100%' } }),
          children: [
            { nodeType: 'heading', displayName: 'Map title', props: { text: 'Visit our office', tag: 'h2' }, style_json: desktop({ typography: { fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: '800', lineHeight: '1.12' }, colors: { textColor: '#0f172a' } }) },
            { nodeType: 'text', displayName: 'Address', props: { text: 'Tower B2, Spaze-I-Tech Park, Sector 49, Gurugram, Haryana 122018' }, style_json: desktop({ typography: { fontSize: '16px', lineHeight: '1.6' }, colors: { textColor: '#475569' } }) },
            { nodeType: 'text', displayName: 'Hours', props: { text: 'Mon–Sat · 9:00 AM – 6:00 PM IST' }, style_json: desktop({ typography: { fontSize: '15px', fontWeight: '600' }, colors: { textColor: '#64748b' } }) },
            { nodeType: 'button', displayName: 'Directions CTA', props: { text: 'Open in Google Maps', href: 'https://maps.google.com' }, style_json: desktop({ spacing: { padding: '12px 20px' }, typography: { fontSize: '14px', fontWeight: '800' }, colors: { textColor: '#ffffff', backgroundColor: '#4f46e5' }, border: { radius: '10px' } }) },
          ],
        }],
      },
    ],
  };
}

const COURIER_PARTNERS = [
  { name: 'Delhivery' },
  { name: 'DTDC' },
  { name: 'XpressBees' },
  { name: 'Blue Dart' },
  { name: 'Ecom Express' },
  { name: 'Amazon Shipping' },
  { name: 'Ekart' },
  { name: 'Shadowfax' },
  { name: 'India Post' },
  { name: 'Movin' },
];

const COURIER_PARTNERS_FG = 'var(--live-section-fg, var(--token-text-primary))';
const COURIER_PARTNERS_MUTED = 'var(--live-section-muted, var(--token-text-muted))';
const COURIER_PARTNERS_ACCENT = 'var(--color-primary, #2563eb)';

function buildCourierPartnerCard({ name }) {
  return {
    nodeType: 'stack',
    displayName: name,
    props: tplRole('courier-partner-card'),
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'center',
          flex: '1 1 18%',
          minWidth: '160px',
          maxWidth: '100%',
        },
        spacing: { padding: '28px 20px 22px' },
        border: { radius: '14px', width: '1px', color: 'rgba(15, 23, 42, 0.06)' },
        background: { backgroundColor: 'var(--token-bg-surface, #ffffff)' },
        effects: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' },
      },
      tablet: {
        layout: { flexBasis: 'calc(33.333% - 12px)', minWidth: '140px' },
      },
      mobile: {
        layout: { flexBasis: 'calc(50% - 8px)', minWidth: '130px' },
      },
    },
    children: [
      {
        nodeType: 'image',
        displayName: `${name} image`,
        props: {
          src: '/builder-placeholder.svg',
          alt: `${name} logo`,
          imageFit: 'contain',
          imageHeightPx: 52,
          meta: { tplRole: 'partner-logo-image' },
        },
        style_json: desktop({
          size: { width: '100%', maxWidth: '140px' },
          layout: { alignSelf: 'center' },
        }),
      },
      {
        nodeType: 'text',
        displayName: 'Partner label',
        props: { text: name },
        style_json: desktop({
          typography: { fontSize: '13px', fontWeight: '600', textAlign: 'center', lineHeight: '1.3' },
          colors: { textColor: COURIER_PARTNERS_MUTED },
        }),
      },
    ],
  };
}

export function buildCourierPartnersSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Courier Partners',
    props: sectionRowMeta('courierPartners'),
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center' },
      spacing: { padding: '72px 24px 80px' },
      background: {
        backgroundColor: 'var(--token-bg-primary, #eef3fb)',
        backgroundImage: 'linear-gradient(180deg, #eef3fb 0%, #f5f8fd 100%)',
      },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Partners column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Partners content',
            props: tplRole('section-inner'),
            style_json: desktop({
              layout: { flexDirection: 'column', gap: 36, alignItems: 'stretch', width: '100%' },
            }),
            children: [
              {
                nodeType: 'stack',
                displayName: 'Header',
                style_json: desktop({
                  layout: {
                    flexDirection: 'column',
                    gap: 16,
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '760px',
                    alignSelf: 'center',
                  },
                }),
                children: [
                  {
                    nodeType: 'stack',
                    displayName: 'Network badge',
                    props: tplRole('section-eyebrow'),
                    style_json: desktop({
                      layout: {
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      },
                    }),
                    children: [
                      {
                        nodeType: 'text',
                        displayName: 'Network icon',
                        props: { text: '👥' },
                        style_json: desktop({ typography: { fontSize: '15px', lineHeight: '1' } }),
                      },
                      {
                        nodeType: 'text',
                        displayName: 'Eyebrow label',
                        props: { text: 'OUR NETWORK' },
                        style_json: desktop({
                          typography: {
                            fontSize: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                          },
                          colors: { textColor: COURIER_PARTNERS_ACCENT },
                        }),
                      },
                    ],
                  },
                  {
                    nodeType: 'heading',
                    displayName: 'Section title',
                    props: {
                      text: 'Integrated With Leading Courier Partners',
                      tag: 'h2',
                      ...tplRole('section-title').meta,
                    },
                    style_json: desktop({
                      typography: {
                        fontSize: 'clamp(28px, 3.4vw, 40px)',
                        fontWeight: '800',
                        lineHeight: '1.12',
                        letterSpacing: '-0.02em',
                        textAlign: 'center',
                      },
                      colors: { textColor: COURIER_PARTNERS_FG },
                    }),
                  },
                  {
                    nodeType: 'text',
                    displayName: 'Section subtitle',
                    props: {
                      text:
                        'Connect your existing courier accounts or access supported logistics services through Dispatch Solutions.',
                      ...tplRole('section-subtitle').meta,
                    },
                    style_json: desktop({
                      typography: {
                        fontSize: '17px',
                        lineHeight: '1.65',
                        fontWeight: '400',
                        textAlign: 'center',
                      },
                      colors: { textColor: COURIER_PARTNERS_MUTED },
                      layout: { maxWidth: '680px', alignSelf: 'center' },
                    }),
                  },
                ],
              },
              {
                nodeType: 'stack',
                displayName: 'Partners grid',
                props: itemsHost(),
                style_json: desktop({
                  layout: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 16,
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    width: '100%',
                  },
                }),
                children: COURIER_PARTNERS.map((partner) => buildCourierPartnerCard(partner)),
              },
            ],
          },
        ],
      },
    ],
  };
}
