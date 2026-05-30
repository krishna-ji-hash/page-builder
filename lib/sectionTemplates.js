/**
 * Declarative section trees (no ids). Prefer bulk API insert for stable ordering + one snapshot refresh.
 * Shapes: row → column → stack → blocks.
 */

import {
  COLUMN_MOBILE_PATCH,
  HEADER_COLUMN_MOBILE_PATCH,
  HEADER_ROW_MOBILE_COMPACT_FRAGMENT,
  ROW_MOBILE_STACK_FRAGMENT,
} from '@/lib/responsiveLayoutDefaults';
import { autoFixTree, validateTree } from '@/lib/builderTree';
import { DEFAULT_FEATURE_TABS } from '@/lib/featureTabsDefaults';
import { DEFAULT_FAQ_ITEMS } from '@/lib/faqAccordionDefaults';
import {
  buildPricingSectionRow,
  buildStatsCounterSectionRow,
  buildContactFormSectionRow,
  buildBlogPreviewSectionRow,
  buildTimelineSectionRow,
  buildComparisonTableSectionRow,
  buildGallerySectionRow,
  buildTeamSectionRow,
  buildVideoSectionRow,
  buildProcessStepsSectionRow,
  buildTrustBadgesSectionRow,
  buildBrandsLogoSliderSectionRow,
  buildWebStorySectionRow,
  buildMapIntegrationSectionRow,
} from '@/lib/templateSectionContent.js';

const desktop = (patch) => ({ desktop: { ...patch } });

/** Default: sections stack vertically on small breakpoints (override with explicit mobile in style_json). */
const rowMobileStack = { ...ROW_MOBILE_STACK_FRAGMENT };

const colMobileFull = { ...COLUMN_MOBILE_PATCH };

function columnStyle(desktopLayer = {}) {
  const spacing = {
    padding: '0 0 24px',
    ...(desktopLayer.spacing || {}),
  };
  return {
    desktop: { ...desktopLayer, spacing },
    ...colMobileFull,
  };
}

function headerColumnStyle(desktopLayer = {}) {
  const spacing = {
    padding: '0',
    ...(desktopLayer.spacing || {}),
  };
  return {
    desktop: { ...desktopLayer, spacing },
    ...HEADER_COLUMN_MOBILE_PATCH,
  };
}

function rowStyle(desktopPatch) {
  return {
    ...rowMobileStack,
    desktop: { ...desktopPatch },
  };
}

function headerRowStyle(desktopPatch) {
  return {
    ...HEADER_ROW_MOBILE_COMPACT_FRAGMENT,
    desktop: { ...desktopPatch },
  };
}

const HEADER_MENU_ITEMS = [
  { label: 'Home', to: '#' },
  { label: 'About Us', to: '#' },
  { label: 'Solutions', to: '#' },
  { label: 'Blog', to: '#' },
  { label: 'Contact Us', to: '#' },
];

function headerLogoBlock() {
  return {
    nodeType: 'image',
    displayName: 'Logo',
    props: { src: '/builder-placeholder.svg', alt: 'Company logo' },
    style_json: desktop({ size: { width: '156px', maxWidth: '100%', height: 'auto' } }),
  };
}

function headerMenuBlock() {
  return {
    nodeType: 'menu',
    displayName: 'Primary links',
    props: {
      variant: 'underline',
      align: 'center',
      items: HEADER_MENU_ITEMS,
      mobile: { enabled: true, hamburgerAlign: 'right' },
    },
    style_json: desktop({
      typography: { fontSize: '14px', fontWeight: '650' },
      colors: { textColor: '#0f172a' },
      menu: { gap: 18, itemPadding: '10px 8px' },
    }),
  };
}

function headerActionsStack(justify = 'flex-end') {
  return {
    nodeType: 'stack',
    displayName: 'Actions stack',
    style_json: {
      desktop: {
        layout: {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: justify,
          alignItems: 'center',
          gap: 10,
          width: '100%',
        },
      },
      tablet: {
        layout: {
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          width: 'auto',
        },
      },
      mobile: {
        layout: {
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          width: 'auto',
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
          colors: {
            textColor: 'var(--live-section-fg, var(--color-text))',
            backgroundColor: 'transparent',
          },
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
  };
}

function headerLogoColumn() {
  return {
    nodeType: 'column',
    displayName: 'Logo',
    style_json: headerColumnStyle({
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
        style_json: {
          desktop: {
            layout: { width: 'auto', justifyContent: 'flex-start', alignItems: 'center' },
          },
          mobile: {
            layout: { width: 'auto', maxWidth: '100%', justifyContent: 'flex-start', alignItems: 'center' },
          },
          tablet: {
            layout: { width: 'auto', maxWidth: '100%', justifyContent: 'flex-start', alignItems: 'center' },
          },
        },
        children: [headerLogoBlock()],
      },
    ],
  };
}

function headerNavColumn() {
  return {
    nodeType: 'column',
    displayName: 'Nav',
    style_json: headerColumnStyle({
      layout: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 0,
        marginLeft: 'auto',
      },
      size: { width: 'auto', maxWidth: '100%' },
    }),
    children: [
      {
        nodeType: 'stack',
        displayName: 'Nav stack',
        style_json: {
          desktop: {
            layout: { width: 'auto', justifyContent: 'flex-end', alignItems: 'center' },
          },
          mobile: {
            layout: { width: 'auto', justifyContent: 'flex-end', alignItems: 'center', marginLeft: 'auto' },
          },
          tablet: {
            layout: { width: 'auto', justifyContent: 'flex-end', alignItems: 'center', marginLeft: 'auto' },
          },
        },
        children: [headerMenuBlock()],
      },
    ],
  };
}

function headerActionsColumn() {
  return {
    nodeType: 'column',
    displayName: 'Actions',
    style_json: headerColumnStyle({
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
    children: [headerActionsStack('flex-end')],
  };
}

/**
 * Header section variants:
 * - spread: full-bleed bg + logo left / menu center / buttons right across the viewport
 * - boxed: full-bleed bg + same bar inside a centered max-width column (reference layout)
 * - centered: full-bleed bg + logo, menu, and buttons grouped in the middle
 * @param {'spread'|'boxed'|'centered'} variant
 */
export function buildHeaderSectionTree(variant = 'boxed') {
  const v = String(variant || 'boxed').toLowerCase();
  const isSpread = v === 'spread' || v === 'full';
  const isCentered = v === 'centered' || v === 'center';
  const isBoxed = !isSpread && !isCentered;

  const meta = {
    isHeader: true,
    role: 'header',
    rootStripLayout: 'full',
    headerLayout: isSpread ? 'spread' : isCentered ? 'centered' : 'boxed',
    headerAlign: isCentered ? 'center' : 'between',
    headerContentWidth: isBoxed ? 'boxed' : 'full',
    ...(isBoxed ? { headerContentMaxWidthPx: 1200 } : {}),
  };

  const rowChildren = isCentered
    ? [
        {
          nodeType: 'column',
          displayName: 'Center group',
          style_json: columnStyle({
            layout: {
              flexGrow: 0,
              flexShrink: 1,
              flexBasis: 'auto',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
            },
            size: { width: 'auto', maxWidth: '100%' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Header center stack',
              style_json: {
                desktop: {
                  layout: {
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 20,
                    width: '100%',
                  },
                },
                mobile: {
                  layout: {
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                  },
                },
                tablet: {
                  layout: {
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                  },
                },
              },
              children: [
                {
                  nodeType: 'stack',
                  displayName: 'Logo stack',
                  style_json: desktop({
                    layout: { justifyContent: 'center', alignItems: 'center' },
                  }),
                  children: [headerLogoBlock()],
                },
                {
                  nodeType: 'stack',
                  displayName: 'Nav stack',
                  style_json: desktop({
                    layout: { justifyContent: 'center', alignItems: 'center' },
                  }),
                  children: [headerMenuBlock()],
                },
                headerActionsStack('center'),
              ],
            },
          ],
        },
      ]
    : [headerLogoColumn(), headerNavColumn(), headerActionsColumn()];

  return {
    nodeType: 'row',
    displayName: isSpread ? 'Header (full width)' : isCentered ? 'Header (centered)' : 'Header (boxed)',
    props: { meta },
    style_json: headerRowStyle({
      layout: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: isCentered ? 'center' : 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 14,
      },
      spacing: { padding: '14px 24px' },
      size: { minHeight: '78px' },
      background: { backgroundColor: 'var(--color-surface)' },
      effects: { boxShadow: '0 10px 28px rgba(15,23,42,0.08)' },
    }),
    children: rowChildren,
  };
}

const WHY_CHOOSE_COURIER_FEATURES = [
  {
    icon: '📦',
    title: '27+ Verified Courier Partners',
    description:
      'Every courier partner is vetted for speed, reliability, and serviceability across major shipping lanes in India. Compare courier rates, choose the best option per shipment, and manage everything from a single shipping dashboard.',
  },
  {
    icon: '🏷️',
    title: 'No Platform Fees',
    description:
      'No hidden charges, no monthly subscription, no per-order platform fee. You pay only for the shipping you use — the courier aggregator dashboard, rate comparison, label generation, and tracking tools are completely free.',
  },
  {
    icon: '🌍',
    title: '29,000+ Pincodes + International Reach',
    description:
      'Deliver to Tier 2, Tier 3, and remote pincodes that most courier services can\'t reach — plus international shipping for cross-border eCommerce. Pan-India coverage across 29,000+ serviceable pincodes means you never lose an order because of delivery limitations.',
  },
  {
    icon: '⚖️',
    title: 'Transparent Weight Dispute Resolution',
    description:
      'Weight discrepancies silently drain eCommerce margins. Shipmozo provides a fully documented weight dispute process with proper proof — so you never lose money on incorrect weight charges. Every dispute is tracked, transparent, and resolved fairly.',
  },
];

function buildWhyChooseCourierFeatureItem({ icon, title, description }) {
  return {
    nodeType: 'stack',
    displayName: title,
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'row',
          gap: 16,
          alignItems: 'flex-start',
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 'calc(50% - 16px)',
          minWidth: 0,
          maxWidth: 'calc(50% - 16px)',
        },
      },
      tablet: {
        layout: {
          flexBasis: 'calc(50% - 12px)',
          maxWidth: 'calc(50% - 12px)',
        },
      },
      mobile: {
        layout: {
          flexBasis: '100%',
          maxWidth: '100%',
        },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Icon box',
        style_json: desktop({
          layout: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: '0 0 auto',
          },
          size: { width: '60px', minWidth: '60px', height: '60px' },
          border: { radius: '12px' },
          background: { backgroundColor: '#ffffff' },
          effects: { boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)' },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Icon',
            props: { text: icon },
            style_json: desktop({
              typography: { fontSize: '28px', lineHeight: '1', textAlign: 'center' },
            }),
          },
        ],
      },
      {
        nodeType: 'stack',
        displayName: 'Copy',
        style_json: desktop({
          layout: { flexDirection: 'column', gap: 8, alignItems: 'stretch', flex: '1 1 0', minWidth: 0 },
        }),
        children: [
          {
            nodeType: 'heading',
            displayName: 'Title',
            props: { text: title },
            style_json: desktop({
              typography: { fontSize: '18px', fontWeight: '800', lineHeight: '1.25' },
              colors: { textColor: '#0f172a' },
            }),
          },
          {
            nodeType: 'text',
            displayName: 'Body',
            props: { text: description },
            style_json: desktop({
              typography: { fontSize: '14px', lineHeight: '1.65' },
              colors: { textColor: '#64748b' },
            }),
          },
        ],
      },
    ],
  };
}

/** 2×2 feature grid: one flex-wrap row (Shipmozo reference layout). */
function buildWhyChooseCourierFeatureGrid(features) {
  return {
    nodeType: 'stack',
    displayName: 'Feature grid',
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 32,
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          width: '100%',
        },
      },
      tablet: {
        layout: { gap: 24 },
      },
      mobile: {
        layout: {
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: 28,
        },
      },
    },
    children: features.map((item) => buildWhyChooseCourierFeatureItem(item)),
  };
}

const COURIER_FEATURE_BANDS = [
  {
    displayName: 'AI Courier band',
    imageFirst: true,
    backgroundColor: '#ffffff',
    imageAlt: 'AI courier allocation dashboard',
    heading: 'AI Courier Allocation for eCommerce Shipping',
    paragraph:
      "Shipmozo's AI courier selection engine auto-assigns the best courier for every shipment based on lane performance, delivery speed, COD risk, pincode serviceability, and shipping cost — so you get higher delivery success rates with fewer NDR exceptions and lower RTO. No manual courier selection needed — it works automatically after setup.",
    bullets: [
      {
        title: 'WhatsApp COD Confirmation',
        body: 'Verify COD intent before dispatch to reduce RTO.',
      },
      {
        title: 'Checkout Address Intelligence',
        body: 'Detect risky/incomplete addresses and save clean delivery details.',
      },
      {
        title: 'Date (ETA)',
        body: 'Show buyers reliable delivery dates they can trust.',
      },
    ],
  },
  {
    displayName: 'Volumetric band',
    imageFirst: false,
    backgroundColor: '#f8fafc',
    imageAlt: 'Dead weight scale — no volumetric charges',
    heading: 'No Volumetric Weight Charges Up to 2kg* — Pay Only for Dead Weight',
    paragraph:
      'Stop paying extra for volumetric weight surprises. Shipmozo offers volumetric-free shipping slabs up to 2kg* across selected courier partners — meaning your lightweight, bulky parcels get charged by actual dead weight, not inflated volumetric calculations. Lower shipping costs, predictable billing, and better profit margins on every order.',
    bullets: [],
  },
  {
    displayName: 'Verification band',
    imageFirst: true,
    backgroundColor: '#ffffff',
    imageAlt: 'Order verification and dedicated KAM support',
    heading: 'Free Order Verification + Dedicated KAM',
    paragraph:
      'Boost delivery success with free pre-dispatch order verification via WhatsApp, SMS, and email — buyers confirm their COD intent, address, and availability before you spend on shipping. And when something goes wrong, your Dedicated Key Account Manager (KAM) handles escalations, pickup issues, and courier disputes directly — no ticket queues, no chatbot runarounds.',
    bullets: [],
  },
];

function buildCourierFeatureBandBullets(items) {
  return items.map((item) => ({
    nodeType: 'stack',
    displayName: item.title,
    style_json: desktop({
      layout: { flexDirection: 'column', gap: 6, alignItems: 'stretch' },
    }),
    children: [
      {
        nodeType: 'heading',
        displayName: 'Bullet title',
        props: { text: item.title, tag: 'h3' },
        style_json: desktop({
          typography: { fontSize: '15px', fontWeight: '800', lineHeight: '1.35' },
          colors: { textColor: '#0f172a' },
        }),
      },
      {
        nodeType: 'text',
        displayName: 'Bullet body',
        props: { text: item.body },
        style_json: desktop({
          typography: { fontSize: '14px', lineHeight: '1.6' },
          colors: { textColor: '#64748b' },
        }),
      },
    ],
  }));
}

function buildCourierFeatureBandCopyColumn({ heading, paragraph, bullets = [], mobileOrder = 2 }) {
  const children = [
    {
      nodeType: 'heading',
      displayName: 'Heading',
      props: { text: heading },
      style_json: desktop({
        typography: { fontSize: '32px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.02em' },
        colors: { textColor: '#0f172a' },
      }),
    },
    {
      nodeType: 'text',
      displayName: 'Body',
      props: { text: paragraph },
      style_json: desktop({
        typography: { fontSize: '16px', lineHeight: '1.7' },
        colors: { textColor: '#475569' },
      }),
    },
  ];
  if (bullets.length) {
    children.push({
      nodeType: 'stack',
      displayName: 'Highlights',
      style_json: desktop({
        layout: { flexDirection: 'column', gap: 14, alignItems: 'stretch' },
        spacing: { padding: '8px 0 0' },
      }),
      children: buildCourierFeatureBandBullets(bullets),
    });
  }
  return {
    nodeType: 'column',
    displayName: 'Copy',
    style_json: {
      ...columnStyle({
        layout: {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 0,
          maxWidth: '100%',
          justifyContent: 'center',
        },
      }),
      mobile: {
        layout: { order: mobileOrder },
        size: { width: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Copy stack',
        style_json: desktop({
          layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' },
          spacing: { padding: '12px 8px' },
        }),
        children,
      },
    ],
  };
}

function buildCourierFeatureBandImageColumn({ imageAlt, imageHeightPx = 380, mobileOrder = 1 }) {
  return {
    nodeType: 'column',
    displayName: 'Visual',
    style_json: {
      ...columnStyle({
        layout: {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 0,
          maxWidth: '100%',
          justifyContent: 'center',
        },
      }),
      mobile: {
        layout: { order: mobileOrder },
        size: { width: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Image stack',
        style_json: desktop({
          layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch', width: '100%' },
        }),
        children: [
          {
            nodeType: 'image',
            displayName: 'Feature visual',
            props: {
              src: '/builder-placeholder.svg',
              alt: imageAlt,
              imageFit: 'cover',
              imageHeightPx,
            },
            style_json: desktop({
              size: { width: '100%' },
              border: { radius: '16px' },
              effects: { boxShadow: '0 14px 36px rgba(15, 23, 42, 0.1)' },
            }),
          },
        ],
      },
    ],
  };
}

/**
 * One 50/50 band: image + copy (alternating via `imageFirst`).
 * @param {typeof COURIER_FEATURE_BANDS[0]} band
 * @param {{ padding?: string, bandIndex?: number }} [opts]
 */
function buildCourierFeatureBandRow(band, opts = {}) {
  const imageFirst = Boolean(band.imageFirst);
  const imageCol = buildCourierFeatureBandImageColumn({
    imageAlt: band.imageAlt,
    mobileOrder: 1,
  });
  const copyCol = buildCourierFeatureBandCopyColumn({
    heading: band.heading,
    paragraph: band.paragraph,
    bullets: band.bullets || [],
    mobileOrder: 2,
  });
  const children = imageFirst ? [imageCol, copyCol] : [copyCol, imageCol];

  return {
    nodeType: 'row',
    displayName: band.displayName,
    props: {
      meta: {
        sectionTemplate: 'courierFeatureBands',
        bandKey: band.displayName,
      },
    },
    style_json: rowStyle({
      layout: {
        gap: 40,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'nowrap',
      },
      spacing: { padding: opts.padding || '56px 24px' },
      background: { backgroundColor: band.backgroundColor || '#ffffff' },
    }),
    children,
  };
}

function buildPlatformHeroArrowChip() {
  return {
    nodeType: 'text',
    displayName: 'Arrow',
    props: { text: '↗' },
    style_json: desktop({
      typography: { fontSize: '14px', fontWeight: '800', lineHeight: '1' },
      spacing: { padding: '9px 11px' },
      colors: { textColor: '#ffffff', backgroundColor: '#111111' },
      border: { radius: '999px' },
    }),
  };
}

const PLATFORM_HERO_FEATURE_CARD_BG = {
  international: '#241f1c',
  bulk: '#152420',
};

function buildPlatformHeroFeatureCard({ title, bodyHtml, backgroundColor }) {
  return {
    nodeType: 'stack',
    displayName: title,
    props: { meta: { tplRole: 'platform-feature-card' } },
    style_json: desktop({
      layout: {
        flexDirection: 'column',
        gap: 14,
        alignItems: 'stretch',
        flex: '1 1 0',
        minWidth: 0,
      },
      spacing: { padding: '24px 22px' },
      border: { radius: '20px' },
      background: { backgroundColor },
    }),
    children: [
      {
        nodeType: 'stack',
        displayName: 'Card top',
        style_json: desktop({
          layout: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            width: '100%',
          },
        }),
        children: [buildPlatformHeroArrowChip()],
      },
      {
        nodeType: 'heading',
        displayName: 'Title',
        props: { text: title },
        style_json: desktop({
          typography: {
            fontSize: '24px',
            fontWeight: '800',
            lineHeight: '1.15',
            fontFamily: 'Georgia, "Times New Roman", serif',
          },
          colors: { textColor: '#f8fafc' },
        }),
      },
      {
        nodeType: 'text',
        displayName: 'Body',
        props: { text: bodyHtml },
        style_json: desktop({
          typography: { fontSize: '14px', lineHeight: '1.65' },
          colors: { textColor: 'rgba(248, 250, 252, 0.82)' },
        }),
      },
    ],
  };
}

function buildPlatformHeroSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Platform Hero',
    props: { meta: { sectionTemplate: 'platformHero' } },
    style_json: rowStyle({
      layout: {
        gap: 20,
        justifyContent: 'center',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
      },
      spacing: { padding: '32px 24px 48px' },
      background: { backgroundColor: '#f4f6f8' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Pitch card',
        style_json: columnStyle({
          layout: {
            flexGrow: 2,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 'min(100%, 280px)',
            maxWidth: '100%',
            alignSelf: 'stretch',
          },
          spacing: { padding: '40px 36px' },
          border: { radius: '24px' },
          background: { backgroundColor: '#0a0a0a' },
        }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Pitch stack',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 22,
                alignItems: 'stretch',
                justifyContent: 'space-between',
                minHeight: '100%',
                width: '100%',
              },
            }),
            children: [
              {
                nodeType: 'stack',
                displayName: 'Pitch copy',
                style_json: desktop({
                  layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch' },
                }),
                children: [
                  {
                    nodeType: 'heading',
                    displayName: 'Headline',
                    props: { text: 'One Platform for Every Shipment' },
                    style_json: desktop({
                      typography: {
                        fontSize: 'clamp(32px, 4vw, 46px)',
                        fontWeight: '800',
                        lineHeight: '1.08',
                        letterSpacing: '-0.02em',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                      },
                      colors: { textColor: '#ffffff' },
                    }),
                  },
                  {
                    nodeType: 'text',
                    displayName: 'Subcopy',
                    props: {
                      text: 'Manage B2C, B2B & international shipments with one shipping aggregator.',
                    },
                    style_json: desktop({
                      typography: { fontSize: '15px', lineHeight: '1.65' },
                      colors: { textColor: 'rgba(248,250,252,0.82)' },
                    }),
                  },
                ],
              },
              {
                nodeType: 'stack',
                displayName: 'CTA row',
                style_json: desktop({
                  layout: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
                  spacing: { padding: '4px 0 0' },
                }),
                children: [
                  {
                    nodeType: 'button',
                    displayName: 'Get Started',
                    props: { text: 'Get Started', href: '#' },
                    style_json: desktop({
                      spacing: { padding: '13px 24px' },
                      typography: { fontSize: '14px', fontWeight: '700' },
                      colors: { textColor: '#111111', backgroundColor: '#ffffff' },
                      border: { radius: '999px' },
                    }),
                  },
                  {
                    nodeType: 'button',
                    displayName: 'Sign Up',
                    props: { text: 'Sign Up', href: '#' },
                    style_json: desktop({
                      spacing: { padding: '13px 24px' },
                      typography: { fontSize: '14px', fontWeight: '700' },
                      colors: { textColor: '#ffffff', backgroundColor: '#1d4ed8' },
                      border: { radius: '999px' },
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        nodeType: 'column',
        displayName: 'Visual column',
        style_json: columnStyle({
          layout: {
            flexGrow: 4,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            maxWidth: '100%',
            alignSelf: 'stretch',
          },
        }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Visual stack',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 20,
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                width: '100%',
                minHeight: '100%',
              },
            }),
            children: [
              {
                nodeType: 'image',
                displayName: 'Hero visual',
                props: {
                  src: '/builder-placeholder.svg',
                  alt: 'Courier with packages at delivery van',
                  imageFit: 'cover',
                  imageHeightPx: 400,
                },
                style_json: desktop({
                  size: { width: '100%' },
                  border: { radius: '20px' },
                  effects: { boxShadow: '0 12px 32px rgba(15, 23, 42, 0.1)' },
                }),
              },
              {
                nodeType: 'stack',
                displayName: 'Feature cards row',
                style_json: {
                  desktop: {
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      gap: 20,
                      alignItems: 'stretch',
                      justifyContent: 'stretch',
                      width: '100%',
                      flexGrow: 1,
                    },
                  },
                  mobile: {
                    layout: {
                      flexDirection: 'column',
                      flexWrap: 'nowrap',
                      gap: 16,
                      alignItems: 'stretch',
                    },
                  },
                },
                children: [
                  buildPlatformHeroFeatureCard({
                    title: 'International Shipping',
                    backgroundColor: PLATFORM_HERO_FEATURE_CARD_BG.international,
                    bodyHtml:
                      'For international shipping, Shipmozo offers a dedicated workflow to ship to <strong>195+ countries</strong> with <strong>duty-free (DDP) options</strong> (where available), automated export documentation (invoice/packing list/airway bill), and <strong>multi-carrier tracking</strong> from one dashboard.',
                  }),
                  buildPlatformHeroFeatureCard({
                    title: 'Bulk Shipping',
                    backgroundColor: PLATFORM_HERO_FEATURE_CARD_BG.bulk,
                    bodyHtml:
                      'For B2B and heavy dispatch, Shipmozo offers a dedicated bulk/LTL workflow with <strong>ODA management</strong>, <strong>structured weight management</strong> to reduce re-measurement disputes, <strong>ePOD</strong> for documented delivery proof, and <strong>appointment-based delivery</strong> options.',
                  }),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

const HOW_IT_WORKS_STEPS = [
  {
    stepLabel: 'Step 1',
    title: 'Account Setup',
    description:
      'Create an account and set your default pickup address, packaging, and shipping preferences.',
    imageAlt: 'Account setup — delivery partner with packages',
    imageBg: '#5ba3e8',
  },
  {
    stepLabel: 'Step 2',
    title: 'KYC Verification',
    description:
      'Submit documents + selfie to activate courier services, COD, and higher shipment limits.',
    imageAlt: 'KYC verification — verified shipper',
    imageBg: '#6eb0f0',
  },
  {
    stepLabel: 'Step 3',
    title: 'Start Shipping',
    description:
      'Import orders, book pickups, generate labels/invoices, and track shipments from one dashboard.',
    imageAlt: 'Start shipping — parcel boxes',
    imageBg: '#7ab8f2',
  },
];

const HOW_IT_WORKS_CARD_TOP_BG = '#3b7fd4';
const HOW_IT_WORKS_CARD_FRAME_BG = '#0c2340';

/** One step card: blue copy block + illustration area (Shipmozo reference). Stack only — columns cannot live inside stack. */
function buildHowItWorksStepCard({ stepLabel, title, description, imageAlt, imageBg }) {
  return {
    nodeType: 'stack',
    displayName: title,
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'column',
          gap: 0,
          alignItems: 'stretch',
          flex: '1 1 0',
          minWidth: 0,
          maxWidth: '100%',
          minHeight: '100%',
          width: '100%',
          overflow: 'hidden',
        },
        border: { radius: '16px' },
        effects: { boxShadow: '0 10px 32px rgba(29, 78, 216, 0.14)' },
      },
      tablet: {
        layout: {
          flex: '1 1 calc(50% - 12px)',
          minWidth: 'min(100%, 280px)',
          maxWidth: '100%',
        },
      },
      mobile: {
        layout: { flex: '1 1 100%', maxWidth: '100%' },
        size: { width: '100%' },
      },
    },
    children: [
          {
            nodeType: 'stack',
            displayName: 'Step copy',
            style_json: desktop({
              layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch' },
              spacing: { padding: '28px 26px 26px' },
              background: { backgroundColor: HOW_IT_WORKS_CARD_TOP_BG },
            }),
            children: [
              {
                nodeType: 'text',
                displayName: 'Step label',
                props: { text: stepLabel },
                style_json: desktop({
                  typography: { fontSize: '13px', fontWeight: '700', lineHeight: '1.2', letterSpacing: '0.04em' },
                  colors: { textColor: '#bfe4ff' },
                }),
              },
              {
                nodeType: 'heading',
                displayName: 'Step title',
                props: { text: title, tag: 'h3' },
                style_json: desktop({
                  typography: { fontSize: '22px', fontWeight: '800', lineHeight: '1.2' },
                  colors: { textColor: '#ffffff' },
                }),
              },
              {
                nodeType: 'text',
                displayName: 'Step body',
                props: { text: description },
                style_json: desktop({
                  typography: { fontSize: '14px', lineHeight: '1.65' },
                  colors: { textColor: 'rgba(255,255,255,0.92)' },
                }),
              },
            ],
          },
          {
            nodeType: 'stack',
            displayName: 'Step visual',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                alignItems: 'stretch',
                flex: '1 1 auto',
                minHeight: '240px',
              },
              spacing: { padding: '20px 18px 22px' },
              background: { backgroundColor: imageBg },
            }),
            children: [
              {
                nodeType: 'stack',
                displayName: 'Image frame',
                style_json: desktop({
                  layout: { flexDirection: 'column', alignItems: 'stretch', width: '100%', flex: '1 1 auto' },
                  spacing: { padding: '14px' },
                  border: { radius: '14px' },
                  background: { backgroundColor: HOW_IT_WORKS_CARD_FRAME_BG },
                }),
                children: [
                  {
                    nodeType: 'image',
                    displayName: 'Step illustration',
                    props: {
                      src: '/builder-placeholder.svg',
                      alt: imageAlt,
                      imageFit: 'cover',
                      imageHeightPx: 200,
                    },
                    style_json: desktop({
                      size: { width: '100%' },
                      border: { radius: '10px' },
                    }),
                  },
                ],
              },
            ],
          },
        ],
  };
}

/** 3-column step grid (flex row stack — rows are root-only in builder hierarchy). */
function buildHowItWorksStepsGrid() {
  return {
    nodeType: 'stack',
    displayName: 'Steps grid',
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: 24,
          alignItems: 'stretch',
          justifyContent: 'center',
          width: '100%',
        },
      },
      tablet: {
        layout: {
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'stretch',
        },
      },
      mobile: {
        layout: {
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: 24,
          alignItems: 'stretch',
        },
      },
    },
    children: HOW_IT_WORKS_STEPS.map((step) => buildHowItWorksStepCard(step)),
  };
}

function buildHowItWorksSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'How It Works',
    props: { meta: { sectionTemplate: 'howItWorks' } },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '64px 24px 72px' },
      background: { backgroundColor: '#ffffff' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'How it works column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'How it works content',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 40,
                alignItems: 'center',
                width: '100%',
              },
            }),
            children: [
              {
                nodeType: 'heading',
                displayName: 'Section title',
                props: { text: 'How Shipmozo Works — Start Shipping in 3 Simple Steps' },
                style_json: desktop({
                  typography: {
                    fontSize: 'clamp(26px, 3.2vw, 36px)',
                    fontWeight: '800',
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                  },
                  colors: { textColor: '#0f172a' },
                }),
              },
              buildHowItWorksStepsGrid(),
              {
                nodeType: 'stack',
                displayName: 'CTA wrap',
                style_json: desktop({
                  layout: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  },
                  spacing: { padding: '8px 0 0' },
                }),
                children: [
                  {
                    nodeType: 'button',
                    displayName: 'Start Shipping Now',
                    props: { text: 'Start Shipping Now', href: '#' },
                    style_json: desktop({
                      spacing: { padding: '14px 36px' },
                      typography: { fontSize: '15px', fontWeight: '700' },
                      colors: { textColor: '#ffffff', backgroundColor: '#1a4a8c' },
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
  };
}

const RESOURCES_BLOGS_CARD_BG = '#005696';

const RESOURCES_BLOGS_CARDS = [
  {
    category: 'E-COMMERCE',
    date: 'May 22, 2026',
    title: 'Shipmozo vs Other Aggregators: RTO, Cost & COD Comparison (2025)',
    imageAlt: 'E-commerce shipping comparison',
  },
  {
    category: 'SHIPPING AGGREGATOR',
    date: 'May 21, 2026',
    title: 'How to Choose the Right Courier Aggregator for Your D2C Brand',
    imageAlt: 'Shipping aggregator guide',
  },
  {
    category: 'E-COMMERCE',
    date: 'May 20, 2026',
    title: 'Reduce RTO Rates: NDR Workflows Every Seller Should Use in 2025',
    imageAlt: 'RTO reduction strategies',
  },
];

/** One blue blog card (Shipmozo reference). */
function buildResourcesBlogCard({ category, date, title, imageAlt }) {
  return {
    nodeType: 'stack',
    displayName: title,
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'column',
          gap: 14,
          alignItems: 'stretch',
          flex: '1 1 0',
          minWidth: 0,
          maxWidth: '100%',
          width: '100%',
        },
        spacing: { padding: '22px 20px 24px' },
        border: { radius: '24px' },
        background: { backgroundColor: RESOURCES_BLOGS_CARD_BG },
      },
      tablet: {
        layout: {
          flex: '1 1 calc(50% - 12px)',
          minWidth: 'min(100%, 280px)',
        },
      },
      mobile: {
        layout: { flex: '1 1 100%', maxWidth: '100%' },
        size: { width: '100%' },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Thumbnail frame',
        style_json: desktop({
          layout: { flexDirection: 'column', alignItems: 'stretch', width: '100%' },
          spacing: { padding: '10px' },
          border: { radius: '16px' },
          background: { backgroundColor: '#ffffff' },
        }),
        children: [
          {
            nodeType: 'image',
            displayName: 'Thumbnail',
            props: {
              src: '/builder-placeholder.svg',
              alt: imageAlt,
              imageFit: 'cover',
              imageHeightPx: 168,
            },
            style_json: desktop({
              size: { width: '100%' },
              border: { radius: '12px' },
            }),
          },
        ],
      },
      {
        nodeType: 'stack',
        displayName: 'Category pill',
        style_json: desktop({
          layout: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
          spacing: { padding: '6px 12px' },
          border: { radius: '999px' },
          background: { backgroundColor: '#ffffff' },
        }),
        children: [
          {
            nodeType: 'text',
            displayName: 'Category',
            props: { text: category },
            style_json: desktop({
              typography: {
                fontSize: '11px',
                fontWeight: '700',
                lineHeight: '1.2',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              },
              colors: { textColor: '#0f172a' },
            }),
          },
        ],
      },
      {
        nodeType: 'text',
        displayName: 'Date',
        props: { text: date },
        style_json: desktop({
          typography: { fontSize: '13px', fontWeight: '500', lineHeight: '1.3' },
          colors: { textColor: 'rgba(255,255,255,0.88)' },
        }),
      },
      {
        nodeType: 'heading',
        displayName: 'Post title',
        props: { text: title, tag: 'h3' },
        style_json: desktop({
          typography: { fontSize: '18px', fontWeight: '800', lineHeight: '1.35' },
          colors: { textColor: '#ffffff' },
        }),
      },
    ],
  };
}

function buildResourcesBlogsCardsGrid() {
  return {
    nodeType: 'stack',
    displayName: 'Blog cards grid',
    props: { meta: { liveBlogCardsGrid: true } },
    style_json: {
      desktop: {
        layout: {
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: 24,
          alignItems: 'stretch',
          justifyContent: 'center',
          width: '100%',
        },
      },
      tablet: {
        layout: {
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'stretch',
        },
      },
      mobile: {
        layout: {
          flexDirection: 'column',
          flexWrap: 'nowrap',
          gap: 20,
          alignItems: 'stretch',
        },
      },
    },
    children: RESOURCES_BLOGS_CARDS.map((card) => buildResourcesBlogCard(card)),
  };
}

function buildResourcesBlogsSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Resources Blogs',
    props: { meta: { sectionTemplate: 'resourcesBlogs' } },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '64px 24px 72px' },
      background: { backgroundColor: '#ffffff' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Resources blogs column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Resources blogs content',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 36,
                alignItems: 'stretch',
                width: '100%',
              },
            }),
            children: [
              {
                nodeType: 'stack',
                displayName: 'Section header',
                style_json: {
                  desktop: {
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      gap: 20,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    },
                  },
                  mobile: {
                    layout: {
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 16,
                    },
                  },
                },
                children: [
                  {
                    nodeType: 'heading',
                    displayName: 'Section title',
                    props: { text: 'Resources Blogs for all cases', tag: 'h2' },
                    style_json: desktop({
                      typography: {
                        fontSize: 'clamp(28px, 3.5vw, 40px)',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                      },
                      colors: { textColor: '#0f172a' },
                      layout: { flex: '0 1 auto', minWidth: 'min-content' },
                    }),
                  },
                  {
                    nodeType: 'button',
                    displayName: 'View All',
                    props: { text: 'View All', href: '#' },
                    style_json: desktop({
                      spacing: { padding: '12px 28px' },
                      typography: { fontSize: '15px', fontWeight: '700' },
                      colors: { textColor: '#ffffff', backgroundColor: RESOURCES_BLOGS_CARD_BG },
                      border: { radius: '8px' },
                    }),
                  },
                ],
              },
              buildResourcesBlogsCardsGrid(),
            ],
          },
        ],
      },
    ],
  };
}

function buildFaqSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'FAQ',
    props: { meta: { sectionTemplate: 'faq' } },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '64px 24px 72px' },
      background: { backgroundColor: '#ffffff' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'FAQ column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '900px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'FAQ content',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 28,
                alignItems: 'stretch',
                width: '100%',
              },
              spacing: { padding: '0 0 8px' },
            }),
            children: [
              {
                nodeType: 'heading',
                displayName: 'FAQ title',
                props: { text: 'Your Questions, Answered (FAQ)' },
                style_json: desktop({
                  typography: {
                    fontSize: 'clamp(26px, 3.2vw, 34px)',
                    fontWeight: '800',
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                  },
                  colors: { textColor: '#0f172a' },
                }),
              },
              {
                nodeType: 'text',
                displayName: 'FAQ intro',
                props: {
                  text: 'Stay current with all the latest information, trends and industry expectation and more.',
                },
                style_json: desktop({
                  typography: { fontSize: '16px', lineHeight: '1.7', textAlign: 'center' },
                  colors: { textColor: '#64748b' },
                }),
              },
              {
                nodeType: 'accordion',
                displayName: 'FAQ accordion',
                props: {
                  openItemId: '',
                  items: DEFAULT_FAQ_ITEMS,
                },
                style_json: desktop({
                  layout: { width: '100%' },
                  spacing: { padding: '4px 0 0' },
                }),
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildFeatureTabsSectionRow() {
  return {
    nodeType: 'row',
    displayName: 'Feature Tabs',
    props: { meta: { sectionTemplate: 'featureTabs' } },
    style_json: rowStyle({
      layout: { gap: 0, justifyContent: 'center', alignItems: 'stretch' },
      spacing: { padding: '64px 24px 72px' },
      background: { backgroundColor: '#f4f8fc' },
    }),
    children: [
      {
        nodeType: 'column',
        displayName: 'Feature tabs column',
        style_json: columnStyle({ size: { width: '100%', maxWidth: '1180px' } }),
        children: [
          {
            nodeType: 'stack',
            displayName: 'Feature tabs content',
            style_json: desktop({
              layout: {
                flexDirection: 'column',
                gap: 28,
                alignItems: 'stretch',
                width: '100%',
              },
            }),
            children: [
              {
                nodeType: 'heading',
                displayName: 'Section title',
                props: { text: 'What Makes Shipmozo Different from Other Courier Aggregators' },
                style_json: desktop({
                  typography: {
                    fontSize: 'clamp(26px, 3.2vw, 36px)',
                    fontWeight: '800',
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                  },
                  colors: { textColor: '#0f172a' },
                }),
              },
              {
                nodeType: 'text',
                displayName: 'Section intro',
                props: {
                  text: 'Most courier aggregators focus on rates. Shipmozo focuses on delivery success — with AI courier allocation, structured NDR workflows, transparent billing, and dedicated support built for growing eCommerce brands.',
                },
                style_json: desktop({
                  typography: { fontSize: '16px', lineHeight: '1.7', textAlign: 'center' },
                  colors: { textColor: '#475569' },
                }),
              },
              {
                nodeType: 'tabs',
                displayName: 'Feature tabs',
                props: {
                  activeTabId: DEFAULT_FEATURE_TABS[0]?.id,
                  tabs: DEFAULT_FEATURE_TABS,
                  imageFit: 'cover',
                  imageHeightPx: 360,
                  tabAlign: 'center',
                },
                style_json: desktop({
                  layout: { width: '100%' },
                  spacing: { padding: '8px 0 16px' },
                }),
              },
            ],
          },
        ],
      },
    ],
  };
}

export const SECTION_TEMPLATES = {
  /** @deprecated Use headerSpread / headerBoxed — kept for existing flows */
  header: [buildHeaderSectionTree('spread')],
  headerSpread: [buildHeaderSectionTree('spread')],
  headerBoxed: [buildHeaderSectionTree('boxed')],
  headerCentered: [buildHeaderSectionTree('centered')],

  hero: [
    {
      nodeType: 'row',
      displayName: 'Hero',
      style_json: rowStyle({
        layout: { gap: 28, justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap' },
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
          style_json: columnStyle({
            layout: { flexGrow: 52, flexShrink: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%' },
            size: { width: 'auto', maxWidth: '640px' },
          }),
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
                        colors: { textColor: 'var(--live-section-fg, var(--color-text))', backgroundColor: 'color-mix(in srgb, var(--color-surface) 82%, transparent)' },
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
                  nodeType: 'stack',
                  displayName: 'Trust + stats',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 12,
                      justifyContent: 'flex-start',
                      alignItems: 'stretch',
                      width: '100%',
                    },
                    spacing: { padding: '10px 0px 0px' },
                  }),
                  children: [
                    {
                      nodeType: 'stack',
                      displayName: 'Metric 1',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 4, flex: '1 1 30%', minWidth: '100px', maxWidth: '100%' },
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
                    {
                      nodeType: 'stack',
                      displayName: 'Metric 2',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 4, flex: '1 1 30%', minWidth: '100px', maxWidth: '100%' },
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
                    {
                      nodeType: 'stack',
                      displayName: 'Metric 3',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 4, flex: '1 1 30%', minWidth: '100px', maxWidth: '100%' },
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
        {
          nodeType: 'column',
          displayName: 'Hero visual',
          style_json: columnStyle({
            layout: {
              flexGrow: 48,
              flexShrink: 1,
              flexBasis: 0,
              maxWidth: '100%',
              minWidth: 'min(100%, 200px)',
            },
            size: { width: 'auto', maxWidth: '720px' },
          }),
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
                    src: '/builder-placeholder.svg',
                    alt: 'Product dashboard preview',
                    imageFit: 'cover',
                    imageHeightPx: 360,
                  },
                  style_json: desktop({
                    border: { radius: '14px' },
                    size: { width: '100%' },
                  }),
                },
                {
                  nodeType: 'stack',
                  displayName: 'Floating cards row',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 10,
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      width: '100%',
                    },
                  }),
                  children: [
                    {
                      nodeType: 'stack',
                      displayName: 'Glass card A',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 4, flex: '1 1 45%', minWidth: '120px', maxWidth: '100%' },
                        spacing: { padding: '12px' },
                        border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '14px' },
                        background: { backgroundColor: 'rgba(255,255,255,0.08)' },
                      }),
                      children: [
                        { nodeType: 'text', displayName: 'Label', props: { text: 'Conversion' }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '700' }, colors: { textColor: 'rgba(226,232,240,0.82)' } }) },
                        { nodeType: 'heading', displayName: 'Value', props: { text: '+18.2%' }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' }, colors: { textColor: '#ffffff' } }) },
                      ],
                    },
                    {
                      nodeType: 'stack',
                      displayName: 'Glass card B',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 4, flex: '1 1 45%', minWidth: '120px', maxWidth: '100%' },
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

  /**
   * Light, portfolio-style landing hero (matches the provided reference):
   * left: huge headline + copy + dual CTA + feature bullets
   * right: floating product preview card
   */
  heroLanding: [
    {
      nodeType: 'row',
      displayName: 'Hero Landing',
      style_json: rowStyle({
        layout: {
          gap: 28,
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          flexWrap: 'nowrap',
        },
        spacing: { padding: '84px 24px 112px' },
        background: {
          backgroundImage:
            'radial-gradient(900px 520px at 18% 22%, color-mix(in srgb, var(--color-primary) 16%, transparent) 0%, transparent 55%), radial-gradient(820px 520px at 78% 30%, color-mix(in srgb, var(--color-secondary) 16%, transparent) 0%, transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--color-background) 92%, var(--color-primary) 8%) 0%, color-mix(in srgb, var(--color-background) 88%, var(--color-secondary) 12%) 100%)',
          backgroundSize: 'cover',
        },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Hero copy',
          style_json: columnStyle({
            layout: {
              /* 6:4 split of row minus gap — avoids 56% + 44% + gap > 100% overflow/clipping */
              flexGrow: 6,
              flexShrink: 1,
              flexBasis: 0,
              minWidth: 0,
              maxWidth: '100%',
              justifyContent: 'flex-start',
            },
            size: { width: 'auto', maxWidth: '680px' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Copy stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 16, alignItems: 'stretch', justifyContent: 'flex-start' },
              }),
              children: [
                {
                  nodeType: 'text',
                  displayName: 'Kicker',
                  props: { text: 'Multi-carrier logistics' },
                  style_json: desktop({
                    typography: { fontSize: '12px', fontWeight: '900', letterSpacing: '0.06em' },
                    colors: { textColor: 'var(--color-primary)' },
                    spacing: { padding: '8px 12px' },
                    border: {
                      width: '1px',
                      color: 'color-mix(in srgb, var(--color-primary) 32%, transparent)',
                      radius: '999px',
                    },
                    background: { backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)' },
                  }),
                },
                {
                  nodeType: 'heading',
                  displayName: 'Headline',
                  props: {
                    text: 'Dispatch Solutions — multi-carrier integration, smart routing & faster deliveries.',
                  },
                  style_json: desktop({
                    typography: { fontSize: '60px', fontWeight: '950', lineHeight: '0.98', letterSpacing: '-0.03em' },
                    colors: { textColor: 'var(--live-section-fg, var(--color-text))' },
                  }),
                },
                {
                  nodeType: 'text',
                  displayName: 'Subcopy',
                  props: {
                    text: 'One platform for multiple courier partners: automated carrier choice by price, speed, and serviceability — with Same-Day & Next-Day outcomes, manifests, labels, and live tracking.',
                  },
                  style_json: desktop({
                    typography: { fontSize: '16px', lineHeight: '1.7' },
                    colors: { textColor: 'var(--live-section-muted, var(--color-muted))' },
                  }),
                },
                {
                  nodeType: 'stack',
                  displayName: 'CTA row',
                  style_json: desktop({ layout: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' } }),
                  children: [
                    {
                      nodeType: 'button',
                      displayName: 'Primary CTA',
                      props: { text: 'Explore demos', href: '#' },
                      style_json: desktop({
                        spacing: { padding: '14px 20px' },
                        typography: { fontSize: '12px', fontWeight: '950', letterSpacing: '0.08em' },
                        colors: { textColor: '#ffffff', backgroundColor: '#2563eb' },
                        border: { radius: '14px' },
                        effects: { boxShadow: '0 18px 44px rgba(37,99,235,0.30)' },
                      }),
                    },
                    {
                      nodeType: 'button',
                      displayName: 'Secondary CTA',
                      props: { text: 'Buy now', href: '#' },
                      style_json: desktop({
                        spacing: { padding: '14px 18px' },
                        typography: { fontSize: '12px', fontWeight: '950', letterSpacing: '0.08em' },
                        colors: {
                          textColor: 'var(--live-section-fg, var(--color-text))',
                          backgroundColor: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
                        },
                        border: { width: '1px', color: 'var(--color-border)', radius: '14px' },
                      }),
                    },
                  ],
                },
                {
                  nodeType: 'stack',
                  displayName: 'Bullets',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 14,
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      alignContent: 'flex-start',
                      width: '100%',
                    },
                    spacing: { padding: '12px 0 0' },
                  }),
                  children: [
                    { icon: '⚡', text: 'Fast performance' },
                    { icon: '📱', text: 'Fully responsive' },
                    { icon: '</>', text: 'Clean architecture' },
                  ].map((b) => ({
                    nodeType: 'stack',
                    displayName: b.text,
                    style_json: desktop({
                      layout: { flexDirection: 'row', gap: 8, alignItems: 'center', flex: '0 0 auto' },
                      size: { width: 'auto' },
                      spacing: { padding: '10px 12px' },
                      border: { width: '1px', color: 'var(--color-border)', radius: '999px' },
                      background: {
                        backgroundColor: 'color-mix(in srgb, var(--color-surface) 78%, var(--color-background) 22%)',
                      },
                    }),
                    children: [
                      {
                        nodeType: 'text',
                        displayName: 'Icon',
                        props: { text: b.icon },
                        style_json: desktop({
                          typography: { fontSize: '12px', fontWeight: '900' },
                          colors: { textColor: 'var(--color-primary)' },
                        }),
                      },
                      {
                        nodeType: 'text',
                        displayName: 'Label',
                        props: { text: b.text },
                        style_json: desktop({
                          typography: { fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap' },
                          colors: { textColor: 'var(--live-section-fg, var(--color-text))' },
                        }),
                      },
                    ],
                  })),
                },
              ],
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Hero visual',
          style_json: columnStyle({
            layout: {
              flexGrow: 4,
              flexShrink: 1,
              flexBasis: 0,
              /* Wide enough for preview + builder chrome; min(100%,240px) avoids forcing overflow on tiny frames. */
              minWidth: 'min(100%, 240px)',
              maxWidth: '100%',
              justifyContent: 'flex-start',
            },
            size: { width: 'auto', maxWidth: '560px' },
          }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Preview wrap',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 0, alignItems: 'stretch' },
                spacing: { padding: '0px' },
                /* No card chrome: image sits flush in the column (avoids the thick white frame). */
                background: { backgroundColor: 'transparent' },
              }),
              children: [
                {
                  nodeType: 'image',
                  displayName: 'Preview image',
                  props: {
                    src: '/builder-placeholder.svg',
                    alt: 'Portfolio preview',
                    imageFit: 'cover',
                    imageHeightPx: 320,
                  },
                  style_json: desktop({
                    size: { width: '100%' },
                    border: { radius: '18px' },
                    effects: { boxShadow: '0 40px 90px rgba(2,6,23,0.18)' },
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  /**
   * Bento platform hero (Shipmozo reference):
   * ~1:2 columns — dark pitch (full height) | hero image + two feature tiles
   */
  platformHero: [buildPlatformHeroSectionRow()],

  /**
   * Shipmozo-style “Why Choose” features:
   * header + 2×2 grid with icon box (left) and title/body (right).
   */
  whyChooseCourier: [
    {
      nodeType: 'row',
      displayName: 'Why Choose Courier',
      props: { meta: { sectionTemplate: 'whyChooseCourier' } },
      style_json: rowStyle({
        layout: { gap: 0, justifyContent: 'center' },
        spacing: { padding: '64px 24px 72px' },
        background: { backgroundColor: '#f4f6f8' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Why choose column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1100px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Why choose content',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 40, alignItems: 'stretch', width: '100%' },
              }),
              children: [
                {
                  nodeType: 'stack',
                  displayName: 'Header',
                  style_json: desktop({
                    layout: { flexDirection: 'column', gap: 14, alignItems: 'stretch', width: '100%' },
                  }),
                  children: [
                    {
                      nodeType: 'heading',
                      displayName: 'Section title',
                      props: { text: 'Why Choose Shipmozo as Your Courier Aggregator' },
                      style_json: desktop({
                        typography: {
                          fontSize: '38px',
                          fontWeight: '800',
                          lineHeight: '1.12',
                          letterSpacing: '-0.02em',
                        },
                        colors: { textColor: '#0f172a' },
                      }),
                    },
                    {
                      nodeType: 'text',
                      displayName: 'Section subtitle',
                      props: {
                        text: 'Pan-India and international shipping coverage, a transparent weight dispute process, and zero platform fees—everything an eCommerce seller needs to ship confidently at scale.',
                      },
                      style_json: desktop({
                        typography: { fontSize: '16px', lineHeight: '1.65' },
                        colors: { textColor: '#475569' },
                      }),
                    },
                  ],
                },
                buildWhyChooseCourierFeatureGrid(WHY_CHOOSE_COURIER_FEATURES),
              ],
            },
          ],
        },
      ],
    },
  ],

  /**
   * Three alternating 50/50 feature bands (Shipmozo reference):
   * image|copy → copy|image → image|copy
   */
  courierFeatureBands: COURIER_FEATURE_BANDS.map((band, index) =>
    buildCourierFeatureBandRow(band, {
      padding:
        index === 0 ? '64px 24px 48px' : index === COURIER_FEATURE_BANDS.length - 1 ? '48px 24px 72px' : '48px 24px',
    })
  ),

  /**
   * “How it works” — centered title, 3 step cards (copy + illustration), CTA button.
   */
  howItWorks: [buildHowItWorksSectionRow()],

  /**
   * Tabbed differentiators — nav + copy | image panels (Shipmozo reference).
   */
  featureTabs: [buildFeatureTabsSectionRow()],

  /**
   * Resources blog cards — title + “View All”, 3 blue post cards (Shipmozo reference).
   */
  resourcesBlogs: [buildResourcesBlogsSectionRow()],

  features: [
    {
      nodeType: 'row',
      displayName: 'Features',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: 'var(--color-surface)' },
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
                  nodeType: 'stack',
                  displayName: 'Features grid',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 14,
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      width: '100%',
                    },
                    spacing: { padding: '14px 0px 0px' },
                  }),
                  children: [
                    {
                      nodeType: 'stack',
                      displayName: 'Feature A',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                        spacing: { padding: '18px' },
                        border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                        background: {
                          backgroundColor: 'var(--color-surface)',
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
                    {
                      nodeType: 'stack',
                      displayName: 'Feature B',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                        spacing: { padding: '18px' },
                        border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                        background: { backgroundColor: 'var(--color-surface)' },
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
                    {
                      nodeType: 'stack',
                      displayName: 'Feature C',
                      style_json: desktop({
                        layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                        spacing: { padding: '18px' },
                        border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '16px' },
                        background: {
                          backgroundColor: 'var(--color-surface)',
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
          style_json: columnStyle({
            layout: { flexGrow: 28, flexShrink: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%' },
            size: { width: 'auto' },
          }),
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
                    colors: { textColor: 'rgba(248,250,252,0.94)' },
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
            layout: { flexGrow: 72, flexShrink: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%' },
            size: { width: 'auto' },
          }),
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
                    colors: { textColor: '#0f172a', backgroundColor: 'var(--color-surface)' },
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
                    colors: { textColor: '#312e81', backgroundColor: 'var(--color-surface)' },
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
        background: { backgroundColor: 'var(--color-surface)' },
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
                  nodeType: 'stack',
                  displayName: 'Cards grid row',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 14,
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      width: '100%',
                    },
                    spacing: { padding: '10px 0px 0px' },
                  }),
                  children: [1, 2, 3].map((n) => ({
                    nodeType: 'stack',
                    displayName: `Card ${n}`,
                    style_json: desktop({
                      layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                      spacing: { padding: '16px' },
                      border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '14px' },
                      background: { backgroundColor: 'var(--color-surface)' },
                      effects: { boxShadow: '0 10px 24px rgba(15,23,42,0.06)' },
                    }),
                    children: [
                      {
                        nodeType: 'image',
                        displayName: `Card ${n} image`,
                        props: {
                          src: '/builder-placeholder.svg',
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
        background: { backgroundColor: 'var(--color-background)' },
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
                  nodeType: 'stack',
                  displayName: 'Testimonials row',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 14,
                      alignItems: 'stretch',
                      width: '100%',
                    },
                  }),
                  children: [1, 2].map((n) => ({
                    nodeType: 'stack',
                    displayName: `Testimonial ${n}`,
                    style_json: desktop({
                      layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 45%', minWidth: '280px', maxWidth: '100%' },
                      spacing: { padding: '16px' },
                      border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '14px' },
                      background: { backgroundColor: 'var(--color-surface)' },
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
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  pricing: [buildPricingSectionRow()],

  /** Shipmozo-style FAQ — title, intro, clickable accordion (chevron expand). */
  faq: [buildFaqSectionRow()],

  trustLogos: [
    {
      nodeType: 'row',
      displayName: 'Trust / Logos',
      style_json: rowStyle({
        layout: { gap: 16, justifyContent: 'center' },
        spacing: { padding: '28px 24px' },
        background: { backgroundColor: 'var(--color-surface)' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Trust column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Trust stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 12, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'text',
                  displayName: 'Trust label',
                  props: { text: 'Trusted by teams at' },
                  style_json: desktop({
                    typography: { fontSize: '12px', fontWeight: '800', textAlign: 'center', letterSpacing: '0.08em' },
                    colors: { textColor: 'var(--color-muted)' },
                  }),
                },
                {
                  nodeType: 'stack',
                  displayName: 'Logos row',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 12,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    },
                  }),
                  children: [1, 2, 3, 4].map((n) => ({
                    nodeType: 'stack',
                    displayName: `Logo ${n}`,
                    style_json: desktop({
                      layout: {
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: '1 1 22%',
                        minWidth: '140px',
                        maxWidth: '100%',
                        width: '100%',
                      },
                      spacing: { padding: '10px 12px' },
                      border: { width: '1px', color: 'var(--color-border)', radius: '14px' },
                      background: { backgroundColor: 'var(--color-background)' },
                    }),
                    children: [
                      {
                        nodeType: 'image',
                        displayName: `Logo ${n} image`,
                        props: {
                          src: '/builder-placeholder.svg',
                          alt: `Client logo ${n}`,
                          imageFit: 'contain',
                          imageHeightPx: 26,
                        },
                        style_json: desktop({ size: { width: '100%', height: 'auto' } }),
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

  /** Legacy 3-step outline (Pick template / Customize / Publish) — used by full-page starters. */
  howItWorksSimple: [
    {
      nodeType: 'row',
      displayName: 'How it works (simple)',
      props: { meta: { sectionTemplate: 'howItWorksSimple' } },
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: 'var(--color-surface)' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'How column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'How stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 18, alignItems: 'stretch' } }),
              children: [
                {
                  nodeType: 'heading',
                  displayName: 'How title',
                  props: { text: 'How it works' },
                  style_json: desktop({
                    typography: { fontSize: '34px', fontWeight: '900', textAlign: 'center', lineHeight: '1.1' },
                    colors: { textColor: '#0f172a' },
                  }),
                },
                {
                  nodeType: 'stack',
                  displayName: 'Steps grid',
                  style_json: desktop({
                    layout: {
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 14,
                      justifyContent: 'space-between',
                      alignItems: 'stretch',
                      width: '100%',
                    },
                  }),
                  children: [
                    { step: 'Step 1', title: 'Pick template', body: 'Start from a premium layout.', color: '#4f46e5' },
                    { step: 'Step 2', title: 'Customize', body: 'Edit sections & styles fast.', color: '#0ea5e9' },
                    { step: 'Step 3', title: 'Publish', body: 'Ship a stable responsive page.', color: '#10b981' },
                  ].map((s) => ({
                    nodeType: 'stack',
                    displayName: s.step,
                    style_json: desktop({
                      layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                      spacing: { padding: '18px' },
                      border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '18px' },
                      background: { backgroundColor: 'var(--color-surface)' },
                      effects: { boxShadow: '0 18px 46px rgba(15,23,42,0.08)' },
                    }),
                    children: [
                      { nodeType: 'text', displayName: 'Step', props: { text: s.step }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '900' }, colors: { textColor: s.color } }) },
                      { nodeType: 'heading', displayName: 'Title', props: { text: s.title }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' } }) },
                      { nodeType: 'text', displayName: 'Body', props: { text: s.body }, style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.65' }, colors: { textColor: '#64748b' } }) },
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

  productPreview: [
    {
      nodeType: 'row',
      displayName: 'Product / Dashboard Preview',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: '#0b1220' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Preview column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Preview stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 12, alignItems: 'stretch' },
                spacing: { padding: '12px' },
                border: { width: '1px', color: 'rgba(148,163,184,0.18)', radius: '18px' },
                background: { backgroundColor: 'rgba(255,255,255,0.06)' },
                effects: { boxShadow: '0 30px 70px rgba(0,0,0,0.40)' },
              }),
              children: [
                {
                  nodeType: 'image',
                  displayName: 'Dashboard preview',
                  props: { src: '/builder-placeholder.svg', alt: 'Dashboard preview', imageFit: 'cover', imageHeightPx: 420 },
                  style_json: desktop({ border: { radius: '14px' }, size: { width: '100%' } }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  benefits: [
    {
      nodeType: 'row',
      displayName: 'Benefits',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: 'var(--color-background)' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Benefits column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Benefits grid',
              style_json: desktop({
                layout: {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 14,
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  width: '100%',
                },
              }),
              children: [
                { t: 'Faster', b: 'Launch pages quickly', c: '#4f46e5' },
                { t: 'Smarter', b: 'Reusable sections & styles', c: '#0ea5e9' },
                { t: 'Cheaper', b: 'Less rework across breakpoints', c: '#10b981' },
              ].map((x) => ({
                nodeType: 'stack',
                displayName: x.t,
                style_json: desktop({
                  layout: { flexDirection: 'column', gap: 10, alignItems: 'stretch', flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                  spacing: { padding: '18px' },
                  border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '18px' },
                  background: { backgroundColor: 'var(--color-surface)' },
                  effects: { boxShadow: '0 18px 46px rgba(15,23,42,0.08)' },
                }),
                children: [
                  { nodeType: 'text', displayName: 'Kicker', props: { text: x.t.toUpperCase() }, style_json: desktop({ typography: { fontSize: '12px', fontWeight: '900' }, colors: { textColor: x.c } }) },
                  { nodeType: 'heading', displayName: 'Title', props: { text: x.t }, style_json: desktop({ typography: { fontSize: '18px', fontWeight: '900' } }) },
                  { nodeType: 'text', displayName: 'Body', props: { text: x.b }, style_json: desktop({ typography: { fontSize: '13px', lineHeight: '1.65' }, colors: { textColor: '#64748b' } }) },
                ],
              })),
            },
          ],
        },
      ],
    },
  ],

  stats: [buildStatsCounterSectionRow()],

  contactForm: [buildContactFormSectionRow()],
  blogPreview: [buildBlogPreviewSectionRow()],
  timeline: [buildTimelineSectionRow()],
  comparisonTable: [buildComparisonTableSectionRow()],
  gallery: [buildGallerySectionRow()],
  team: [buildTeamSectionRow()],
  videoSection: [buildVideoSectionRow()],
  processSteps: [buildProcessStepsSectionRow()],
  trustBadges: [buildTrustBadgesSectionRow()],
  brandsLogoSlider: [buildBrandsLogoSliderSectionRow()],
  webStory: [buildWebStorySectionRow()],
  mapIntegration: [buildMapIntegrationSectionRow()],

  integrations: [
    {
      nodeType: 'row',
      displayName: 'Integrations',
      style_json: rowStyle({
        layout: { gap: 18, justifyContent: 'center' },
        spacing: { padding: '72px 24px' },
        background: { backgroundColor: 'var(--color-surface)' },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'Integrations column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '1040px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'Integrations row',
              style_json: desktop({
                layout: {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 14,
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  width: '100%',
                },
              }),
              children: ['Shopify', 'WooCommerce', 'APIs'].map((name) => ({
                nodeType: 'stack',
                displayName: name,
                style_json: desktop({
                  layout: { flexDirection: 'column', gap: 8, flex: '1 1 30%', minWidth: '260px', maxWidth: '100%' },
                  spacing: { padding: '16px' },
                  border: { width: '1px', color: 'rgba(15,23,42,0.10)', radius: '18px' },
                  background: { backgroundColor: 'var(--color-background)' },
                }),
                children: [
                  { nodeType: 'heading', displayName: 'Name', props: { text: name }, style_json: desktop({ typography: { fontSize: '16px', fontWeight: '900' } }) },
                  { nodeType: 'text', displayName: 'Desc', props: { text: 'Connect in minutes' }, style_json: desktop({ typography: { fontSize: '13px' }, colors: { textColor: '#64748b' } }) },
                ],
              })),
            },
          ],
        },
      ],
    },
  ],

  finalCta: [
    {
      nodeType: 'row',
      displayName: 'Final CTA',
      style_json: rowStyle({
        layout: { gap: 16, justifyContent: 'center' },
        spacing: { padding: '64px 24px' },
        background: {
          backgroundColor: '#0b1220',
          backgroundImage:
            'radial-gradient(820px 420px at 22% 30%, rgba(99,102,241,0.35) 0%, transparent 55%), radial-gradient(760px 420px at 78% 35%, rgba(34,211,238,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)',
          backgroundSize: 'cover',
        },
      }),
      children: [
        {
          nodeType: 'column',
          displayName: 'CTA column',
          style_json: columnStyle({ size: { width: '100%', maxWidth: '760px' } }),
          children: [
            {
              nodeType: 'stack',
              displayName: 'CTA stack',
              style_json: desktop({ layout: { flexDirection: 'column', gap: 16, alignItems: 'center' } }),
              children: [
                { nodeType: 'heading', displayName: 'Headline', props: { text: 'Start free today' }, style_json: desktop({ typography: { fontSize: '36px', fontWeight: '950', textAlign: 'center', lineHeight: '1.05' }, colors: { textColor: '#ffffff' } }) },
                { nodeType: 'text', displayName: 'Sub', props: { text: 'Try it now or book a demo—your choice.' }, style_json: desktop({ typography: { fontSize: '16px', lineHeight: '1.6', textAlign: 'center' }, colors: { textColor: 'rgba(226,232,240,0.86)' } }) },
                { nodeType: 'button', displayName: 'Start free', props: { text: 'Start Free', href: '#' }, style_json: desktop({ spacing: { padding: '14px 24px' }, typography: { fontSize: '14px', fontWeight: '950' }, colors: { textColor: 'var(--live-section-fg, var(--color-text))', backgroundColor: 'color-mix(in srgb, var(--color-surface) 82%, transparent)' }, border: { radius: '999px' } }) },
                { nodeType: 'button', displayName: 'Book demo', props: { text: 'Book Demo', href: '#' }, style_json: desktop({ spacing: { padding: '14px 24px' }, typography: { fontSize: '14px', fontWeight: '950' }, colors: { textColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.08)' }, border: { width: '1px', color: 'rgba(148,163,184,0.28)', radius: '999px' } }) },
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
  const rootsFixed = autoFixTree(templateRoots);
  // Fail fast if a template violates strict hierarchy before hitting the DB.
  validateTree(rootsFixed, null);

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
  rootsFixed.forEach((root, rIdx) => {
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
