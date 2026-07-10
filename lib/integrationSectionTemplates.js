/**
 * Dispatch integration page sections (04–08) — polished, fully editable in builder.
 */
import {
  COLUMN_MOBILE_PATCH,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults.js';
import { defaultSectionLayoutFor } from '@/lib/sectionLayout.js';

const desktop = (patch) => ({ desktop: { ...patch } });
const rowMobileStack = { ...ROW_MOBILE_STACK_FRAGMENT };
const colMobileFull = { ...COLUMN_MOBILE_PATCH };

const FG = 'var(--live-section-fg, var(--token-text-primary))';
const MUTED = 'var(--live-section-muted, var(--token-text-muted))';
const ACCENT = 'var(--color-primary, #2563eb)';

const CARD_SURFACE = 'var(--token-bg-surface, #ffffff)';
const CARD_BORDER = 'rgba(37, 99, 235, 0.12)';
const CARD_SHADOW = '0 12px 36px rgba(15, 23, 42, 0.07)';

const INTEGRATION_BG = {
  backgroundColor: 'var(--token-bg-primary, #eef4fc)',
  backgroundImage:
    'radial-gradient(ellipse 80% 50% at 0% 0%, rgba(37, 99, 235, 0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 50%), linear-gradient(180deg, #eef4fc 0%, #f8fafc 100%)',
};

function columnStyle(desktopLayer = {}) {
  return {
    desktop: { ...desktopLayer, spacing: { padding: '0 0 24px', ...(desktopLayer.spacing || {}) } },
    ...colMobileFull,
  };
}

function rowStyle(desktopPatch) {
  return { ...rowMobileStack, desktop: { ...desktopPatch } };
}

function sectionRowMeta(templateId) {
  return {
    meta: {
      sectionTemplate: templateId,
      sectionLayout: defaultSectionLayoutFor(templateId),
      tplPolish: true,
    },
  };
}

function tplRole(role, extra = {}) {
  return { meta: { tplRole: role, ...extra } };
}

function itemsHost() {
  return { meta: { sectionItemsHost: true, tplRole: 'items-host' } };
}

/** Reference-style badge: numbered pill + uppercase label */
function buildEyebrow(number, label, align = 'center') {
  const isCenter = align === 'center';
  return {
    nodeType: 'stack',
    displayName: 'Section badge',
    props: tplRole('integration-eyebrow'),
    style_json: desktop({
      layout: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: isCenter ? 'center' : 'flex-start',
        alignSelf: isCenter ? 'center' : 'flex-start',
        flexWrap: 'wrap',
      },
      spacing: { padding: '6px 14px 6px 6px' },
      border: { radius: '999px', width: '1px', color: 'rgba(37, 99, 235, 0.16)' },
      background: { backgroundColor: 'rgba(255, 255, 255, 0.72)' },
      effects: { boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)' },
    }),
    children: [
      {
        nodeType: 'stack',
        displayName: 'Badge number',
        style_json: desktop({
          layout: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
          size: { width: '28px', height: '28px', minWidth: '28px' },
          border: { radius: '999px' },
          background: { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Number',
            props: { text: number },
            style_json: desktop({
              typography: { fontSize: '11px', fontWeight: '800', lineHeight: '1', textAlign: 'center' },
              colors: { textColor: ACCENT },
            }),
          },
        ],
      },
      {
        nodeType: 'text',
        displayName: 'Eyebrow label',
        props: { text: label },
        style_json: desktop({
          typography: {
            fontSize: '10px',
            fontWeight: '800',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'left',
          },
          colors: { textColor: ACCENT },
        }),
      },
    ],
  };
}

function buildSectionHeader({ number, eyebrow, title, subtitle, align = 'center', maxWidth = '800px' }) {
  const isCenter = align === 'center';
  return {
    nodeType: 'stack',
    displayName: 'Header',
    props: tplRole('integration-header'),
    style_json: desktop({
      layout: {
        flexDirection: 'column',
        gap: 16,
        alignItems: isCenter ? 'center' : 'flex-start',
        width: '100%',
        maxWidth,
        alignSelf: isCenter ? 'center' : 'flex-start',
      },
    }),
    children: [
      buildEyebrow(number, eyebrow, align),
      {
        nodeType: 'heading',
        displayName: 'Section title',
        props: { text: title, tag: 'h2', ...tplRole('section-title').meta },
        style_json: desktop({
          typography: {
            fontSize: 'clamp(28px, 3.4vw, 42px)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-0.025em',
            textAlign: isCenter ? 'center' : 'left',
          },
          colors: { textColor: FG },
        }),
      },
      subtitle
        ? {
            nodeType: 'text',
            displayName: 'Section subtitle',
            props: { text: subtitle, ...tplRole('section-subtitle').meta },
            style_json: desktop({
              typography: {
                fontSize: '17px',
                lineHeight: '1.65',
                fontWeight: '400',
                textAlign: isCenter ? 'center' : 'left',
              },
              colors: { textColor: MUTED },
              layout: { maxWidth: isCenter ? '680px' : '100%' },
            }),
          }
        : null,
    ].filter(Boolean),
  };
}

function buildIconNode(symbol, title, size = 28) {
  return {
    nodeType: 'icon',
    displayName: 'Icon',
    props: { symbol, ariaLabel: title, color: ACCENT },
    style_json: desktop({
      layout: { flex: '0 0 auto', alignSelf: 'flex-start' },
      typography: { fontSize: `${size}px`, lineHeight: '1' },
    }),
  };
}

function buildIconBox(symbol, title, size = 56) {
  return {
    nodeType: 'stack',
    displayName: 'Icon box',
    props: tplRole('integration-icon-box'),
    style_json: desktop({
      layout: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: '0 0 auto',
      },
      size: { width: `${size}px`, minWidth: `${size}px`, height: `${size}px` },
      border: { radius: '14px', width: '1px', color: CARD_BORDER },
      background: {
        backgroundColor: CARD_SURFACE,
        backgroundImage: 'linear-gradient(145deg, rgba(37, 99, 235, 0.1) 0%, rgba(255, 255, 255, 0) 72%)',
      },
      effects: { boxShadow: '0 6px 18px rgba(37, 99, 235, 0.1)' },
    }),
    children: [buildIconNode(symbol, title, Math.round(size * 0.46))],
  };
}

function buildCopyStack(title, description, opts = {}) {
  const { titleColor = FG, titleSize = '17px', bodySize = '14px', align = 'left' } = opts;
  const isCenter = align === 'center';
  return {
    nodeType: 'stack',
    displayName: 'Copy',
    style_json: desktop({
      layout: {
        flexDirection: 'column',
        gap: 8,
        alignItems: isCenter ? 'center' : 'flex-start',
        flex: '1 1 0',
        minWidth: 0,
        width: '100%',
      },
    }),
    children: [
      {
        nodeType: 'heading',
        displayName: 'Title',
        props: { text: title, tag: 'h3' },
        style_json: desktop({
          typography: { fontSize: titleSize, fontWeight: '800', lineHeight: '1.28', textAlign: align },
          colors: { textColor: titleColor },
        }),
      },
      {
        nodeType: 'text',
        displayName: 'Body',
        props: { text: description },
        style_json: desktop({
          typography: { fontSize: bodySize, lineHeight: '1.62', textAlign: align },
          colors: { textColor: MUTED },
        }),
      },
    ],
  };
}

function integrationSectionShell(templateId, displayName, header, itemsHostNode, opts = {}) {
  const { maxWidth = '1180px', padding = '80px 24px 88px' } = opts;
  return {
    nodeType: 'row',
    displayName,
    props: sectionRowMeta(templateId),
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center' },
      spacing: { padding },
      background: INTEGRATION_BG,
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Section column',
        style_json: columnStyle({ size: { width: '100%', maxWidth } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Section content',
            props: tplRole('section-inner'),
            style_json: desktop({
              layout: { flexDirection: 'column', gap: 44, alignItems: 'stretch', width: '100%' },
            }),
            children: [header, itemsHostNode],
          },
        ],
      },
    ],
  };
}

/* —— 04 Integration Benefits —— */
const INTEGRATION_BENEFITS = [
  { icon: '🔗', title: 'Multi-Courier Access', description: 'Connect with multiple courier partners through a single integration.' },
  { icon: '📍', title: 'Real-time Tracking', description: 'Track every shipment in real-time with automated status updates.' },
  { icon: '🖨️', title: 'AWB & Label Generation', description: 'Generate AWBs and shipping labels instantly with one click.' },
  { icon: '🛡️', title: 'Serviceability Check', description: 'Check pincode serviceability and delivery timelines in real-time.' },
  { icon: '📦', title: 'Reduced RTO & NDR', description: 'Proactive tracking and alerts help reduce RTOs and failed deliveries.' },
  { icon: '₹', title: 'Cost Optimization', description: 'Compare rates and select the most cost-effective courier automatically.' },
];

function buildIntegrationBenefitCard({ icon, title, description }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: tplRole('integration-benefit-card'),
    style_json: {
      desktop: {
        layout: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', flex: '1 1 0', width: '100%' },
        spacing: { padding: '22px 20px' },
        border: { radius: '14px', width: '1px', color: CARD_BORDER },
        background: { backgroundColor: CARD_SURFACE },
        effects: { boxShadow: CARD_SHADOW },
        size: { minHeight: '120px', height: '100%' },
      },
    },
    children: [buildIconBox(icon, title, 52), buildCopyStack(title, description, { titleSize: '16px', bodySize: '13px' })],
  };
}

export function buildIntegrationBenefitsSectionRow() {
  return integrationSectionShell(
    'integrationBenefits',
    'Integration Benefits',
    buildSectionHeader({
      number: '04',
      eyebrow: 'INTEGRATION BENEFITS',
      title: 'Why Businesses Choose Our Integration',
      subtitle:
        'Our integration simplifies operations, reduces manual work and delivers a better shipping experience for your customers.',
    }),
    {
      nodeType: 'stack',
      displayName: 'Benefits grid',
      props: itemsHost(),
      style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } }),
      children: INTEGRATION_BENEFITS.map(buildIntegrationBenefitCard),
    }
  );
}

/* —— 05 How Integration Works —— */
const INTEGRATION_STEPS = [
  { step: '01', icon: '📄', title: 'Share API Credentials', description: 'Provide your courier account credentials or request a new account.' },
  { step: '02', icon: '⚙️', title: 'Configure Services', description: 'Select services, set rules, configure preferences and shipping policies.' },
  { step: '03', icon: '💻', title: 'Test Integration', description: "We'll run tests for booking, tracking, webhooks and serviceability." },
  { step: '04', icon: '🚀', title: 'Go Live & Ship', description: "Once tested, you're ready to ship and manage from one dashboard." },
];

function buildIntegrationStepCard({ step, icon, title, description }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: tplRole('integration-step-card', { stepIndex: step }),
    style_json: {
      desktop: {
        layout: { flexDirection: 'column', gap: 14, alignItems: 'center', flex: '1 1 0', width: '100%' },
        spacing: { padding: '28px 18px 24px' },
        border: { radius: '14px', width: '1px', color: CARD_BORDER },
        background: { backgroundColor: CARD_SURFACE },
        effects: { boxShadow: CARD_SHADOW },
        size: { minHeight: '240px', height: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Step badge',
        props: tplRole('integration-step-badge'),
        style_json: desktop({
          layout: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
          size: { width: '44px', height: '44px', minWidth: '44px' },
          border: { radius: '999px' },
          background: { backgroundColor: ACCENT },
          effects: { boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)' },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Step index',
            props: { text: step },
            style_json: desktop({
              typography: { fontSize: '13px', fontWeight: '800', lineHeight: '1', textAlign: 'center' },
              colors: { textColor: 'var(--live-section-fg-on-dark, #f8fafc)' },
            }),
          },
        ],
      },
      buildIconBox(icon, title, 56),
      buildCopyStack(title, description, { titleSize: '15px', bodySize: '13px', align: 'center' }),
    ],
  };
}

export function buildIntegrationStepsSectionRow() {
  return integrationSectionShell(
    'integrationSteps',
    'How Integration Works',
    buildSectionHeader({
      number: '05',
      eyebrow: 'HOW INTEGRATION WORKS',
      title: 'Get Integrated in 4 Simple Steps',
      subtitle: 'Quick, seamless and hassle-free integration in just a few steps.',
      align: 'left',
      maxWidth: '680px',
    }),
    {
      nodeType: 'stack',
      displayName: 'Steps row',
      props: itemsHost(),
      style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } }),
      children: INTEGRATION_STEPS.map(buildIntegrationStepCard),
    },
    { maxWidth: '1220px' }
  );
}

/* —— 06 Integration Features —— */
const INTEGRATION_FEATURES = [
  { icon: '📍', title: 'Pincode Serviceability', description: 'Check serviceability across 20,000+ pincodes.' },
  { icon: '🧮', title: 'Rate Calculation', description: 'Get real-time rates from multiple couriers.' },
  { icon: '🚚', title: 'Automatic Courier Allocation', description: 'Allocate the best courier automatically.' },
  { icon: '🏷️', title: 'AWB & Label Generation', description: 'Generate AWBs & labels instantly.' },
  { icon: '📋', title: 'Manifest Generation', description: 'Create manifests in seconds.' },
  { icon: '📅', title: 'Pickup Scheduling', description: 'Schedule pickups with ease.' },
  { icon: '🕐', title: 'Real-time Tracking', description: 'Track shipments in real-time.' },
  { icon: '⚠️', title: 'NDR Management', description: 'Manage NDRs with smart alerts.' },
  { icon: '↩️', title: 'RTO Tracking', description: 'Track and manage RTO shipments.' },
  { icon: '💰', title: 'COD Reconciliation', description: 'Reconcile COD and remittances easily.' },
  { icon: '🧾', title: 'Invoice & Billing', description: 'Automated invoicing and billing.' },
  { icon: '📊', title: 'Analytics & Reports', description: 'Get insights with advanced reports.' },
];

function buildIntegrationFeatureItem({ icon, title, description }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: tplRole('integration-feature-item'),
    style_json: {
      desktop: {
        layout: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', flex: '1 1 0', width: '100%' },
        spacing: { padding: '10px 6px' },
        size: { minHeight: '72px', height: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Feature icon circle',
        props: tplRole('integration-feature-icon'),
        style_json: desktop({
          layout: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' },
          size: { width: '36px', height: '36px', minWidth: '36px' },
          border: { radius: '8px', width: '1px', color: 'rgba(37, 99, 235, 0.14)' },
          background: { backgroundColor: 'rgba(37, 99, 235, 0.08)' },
        }),
        children: [buildIconNode(icon, title, 18)],
      },
      buildCopyStack(title, description, { titleSize: '14px', bodySize: '12px' }),
    ],
  };
}

export function buildIntegrationFeaturesSectionRow() {
  return integrationSectionShell(
    'integrationFeatures',
    'Integration Features',
    buildSectionHeader({
      number: '06',
      eyebrow: 'INTEGRATION FEATURES',
      title: 'Powerful Features for Complete Automation',
      subtitle: 'Everything you need to manage shipments and scale your logistics operations.',
    }),
    {
      nodeType: 'stack',
      displayName: 'Features grid',
      props: itemsHost(),
      style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } }),
      children: INTEGRATION_FEATURES.map(buildIntegrationFeatureItem),
    },
    { maxWidth: '1200px' }
  );
}

/* —— 07 AI Courier Recommendation —— */
const AI_RECOMMENDATION_CARDS = [
  {
    theme: 'green',
    icon: '₹',
    title: 'Cheapest Option',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.35)',
    description: 'Choose the courier with the lowest shipping cost for maximum savings.',
    bullets: ['Compare real-time rates', 'Lowest cost guaranteed', 'Save more on every order'],
  },
  {
    theme: 'purple',
    icon: '🚀',
    title: 'Fastest Delivery',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.35)',
    description: 'Select the courier with the quickest delivery time for better customer experience.',
    bullets: ['Shortest delivery time', 'Priority delivery options', 'Improve customer satisfaction'],
  },
  {
    theme: 'orange',
    icon: '🧠',
    title: 'AI Recommended',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.12)',
    border: 'rgba(234, 88, 12, 0.35)',
    description: 'AI analyzes performance, RTO rate, cost and speed to recommend the best.',
    bullets: ['Data-driven suggestions', 'High success rate', 'Smart allocation'],
  },
  {
    theme: 'blue',
    icon: '📋',
    title: 'Priority Based',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.35)',
    description: 'Set your preferred courier priority and rules based on your business needs.',
    bullets: ['Custom priority rules', 'Business-specific logic', 'Control in your hands'],
  },
];

function buildBulletItem(text) {
  return {
    nodeType: 'text',
    displayName: 'Bullet',
    props: { text: `• ${text}` },
    style_json: desktop({
      typography: { fontSize: '12px', lineHeight: '1.55' },
      colors: { textColor: MUTED },
    }),
  };
}

function buildAiRecommendationCard({ theme, icon, title, color, bg, border, description, bullets }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: tplRole('ai-recommendation-card', { tplTheme: theme }),
    style_json: {
      desktop: {
        layout: { flexDirection: 'column', gap: 14, alignItems: 'stretch', flex: '1 1 0', width: '100%' },
        spacing: { padding: '22px 20px 20px' },
        border: { radius: '14px', width: '1px', color: 'rgba(15, 23, 42, 0.08)' },
        background: { backgroundColor: CARD_SURFACE },
        effects: { boxShadow: CARD_SHADOW },
        size: { minHeight: '260px', height: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Theme pill',
        props: tplRole('ai-theme-pill'),
        style_json: desktop({
          layout: {
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            alignSelf: 'flex-start',
            flexWrap: 'nowrap',
          },
          spacing: { padding: '7px 14px' },
          border: { radius: '999px', width: '1px', color: border || 'transparent' },
          background: { backgroundColor: bg },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Pill icon',
            props: { text: icon },
            style_json: desktop({ typography: { fontSize: '15px', lineHeight: '1' } }),
          },
          {
            nodeType: 'heading',
            displayName: 'Pill title',
            props: { text: title, tag: 'h3' },
            style_json: desktop({
              typography: { fontSize: '13px', fontWeight: '800', lineHeight: '1.2', textAlign: 'left' },
              colors: { textColor: color },
            }),
          },
        ],
      },
      {
        nodeType: 'text',
        displayName: 'Card description',
        props: { text: description },
        style_json: desktop({
          typography: { fontSize: '13px', lineHeight: '1.58', textAlign: 'left' },
          colors: { textColor: MUTED },
        }),
      },
      {
        nodeType: 'stack',
        displayName: 'Bullet list',
        props: tplRole('ai-bullet-list'),
        style_json: desktop({
          layout: { flexDirection: 'column', gap: 5, alignItems: 'flex-start', flex: '1 1 auto', width: '100%' },
          spacing: { padding: '12px 0 0', margin: 'auto 0 0' },
          border: { width: '1px 0 0 0', color: 'rgba(15, 23, 42, 0.06)' },
        }),
        children: bullets.map(buildBulletItem),
      },
    ],
  };
}

export function buildAiCourierRecommendationSectionRow() {
  return integrationSectionShell(
    'aiCourierRecommendation',
    'AI Courier Recommendation',
    buildSectionHeader({
      number: '07',
      eyebrow: 'SMART COURIER RECOMMENDATION',
      title: 'AI-Powered Courier Recommendation',
      subtitle:
        'Our smart engine compares price, delivery time, success rate and service performance to recommend the best courier for every shipment.',
      align: 'left',
      maxWidth: '760px',
    }),
    {
      nodeType: 'stack',
      displayName: 'Recommendation cards',
      props: itemsHost(),
      style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } }),
      children: AI_RECOMMENDATION_CARDS.map(buildAiRecommendationCard),
    },
    { maxWidth: '1220px' }
  );
}

/* —— 08 Supported Business Types —— */
const BUSINESS_TYPES = [
  { icon: '🛒', title: 'eCommerce Shipping', description: 'Manage orders from Shopify, WooCommerce, Amazon and more.' },
  { icon: '🚛', title: 'B2B & Cargo Shipping', description: 'Handle heavy shipments, bulk orders and B2B logistics easily.' },
  { icon: '📍', title: 'Hyperlocal Delivery', description: 'Fast and reliable same-day or next-day hyperlocal deliveries.' },
  { icon: '🔄', title: 'Reverse Logistics', description: 'Manage returns, RTOs and reverse pickups efficiently.' },
  { icon: '👛', title: 'COD Shipments', description: 'Secure COD handling, reconciliation and settlements.' },
  { icon: '🏭', title: 'Multi-Warehouse', description: 'Ship from multiple warehouses to any location in India.' },
  { icon: '🏪', title: 'Marketplace Orders', description: 'Automate order fulfillment from multiple sales channels.' },
  { icon: '📄', title: 'Document Delivery', description: 'Quick and secure document delivery solutions.' },
];

function buildBusinessTypeCard({ icon, title, description }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: tplRole('business-type-card'),
    style_json: {
      desktop: {
        layout: { flexDirection: 'column', gap: 12, alignItems: 'center', flex: '1 1 0', width: '100%' },
        spacing: { padding: '24px 16px 20px' },
        border: { radius: '14px', width: '1px', color: CARD_BORDER },
        background: { backgroundColor: CARD_SURFACE },
        effects: { boxShadow: CARD_SHADOW },
        size: { minHeight: '180px', height: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Icon circle',
        props: tplRole('business-type-icon'),
        style_json: desktop({
          layout: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
          size: { width: '48px', height: '48px', minWidth: '48px' },
          border: { radius: '999px' },
          background: { backgroundColor: ACCENT },
          effects: { boxShadow: '0 6px 18px rgba(37, 99, 235, 0.22)' },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Icon',
            props: { text: icon },
            style_json: desktop({ typography: { fontSize: '22px', lineHeight: '1' } }),
          },
        ],
      },
      buildCopyStack(title, description, { titleSize: '14px', bodySize: '12px', align: 'center' }),
    ],
  };
}

export function buildBusinessTypesSectionRow() {
  return integrationSectionShell(
    'businessTypes',
    'Supported Business Types',
    buildSectionHeader({
      number: '08',
      eyebrow: 'SUPPORTED BUSINESS TYPES',
      title: 'Built for Every Business Need',
      subtitle: 'Our integration supports all major shipping and logistics use cases.',
      align: 'left',
      maxWidth: '680px',
    }),
    {
      nodeType: 'stack',
      displayName: 'Business types grid',
      props: itemsHost(),
      style_json: desktop({ layout: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } }),
      children: BUSINESS_TYPES.map(buildBusinessTypeCard),
    },
    { maxWidth: '1260px' }
  );
}
