import { SECTION_TEMPLATES } from '@/lib/sectionTemplates';

function composeSections(keys) {
  const roots = [];
  for (const key of keys) {
    const section = SECTION_TEMPLATES[key];
    if (!Array.isArray(section) || !section.length) {
      throw new Error(`Missing section template: ${key}`);
    }
    // Each section template is an array of root rows; concatenate as full-page roots.
    roots.push(...section);
  }
  return roots;
}

/**
 * Full page starter templates.
 * Rules:
 * - normalized node-tree snapshots only (no ids)
 * - style_json preserved and responsive layers are override-only
 */
export const FULL_PAGE_TEMPLATES = [
  {
    id: 'conversion-landing-outline',
    title: 'Conversion Landing (Outline)',
    description: 'Matches the classic landing flow: header → value prop → social proof → benefits → features → testimonials → FAQs.',
    category: 'Full Pages',
    tags: ['conversion', 'landing', 'outline', 'saas'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Conversion+Landing',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'trustLogos', 'benefits', 'features', 'testimonials', 'faq', 'finalCta', 'footer']),
  },
  {
    id: 'professional-homepage',
    title: 'Professional Homepage',
    description: 'Header → Hero → Logos → Features → Steps → Preview → Benefits → Stats → Testimonials → Integrations → Pricing → FAQ → Final CTA → Footer.',
    category: 'Full Pages',
    tags: ['professional', 'homepage', 'conversion', 'saas'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Professional+Homepage',
    responsiveReady: true,
    roots: composeSections([
      'header',
      'hero',
      'trustLogos',
      'features',
      'howItWorks',
      'productPreview',
      'benefits',
      'stats',
      'testimonials',
      'integrations',
      'pricing',
      'faq',
      'finalCta',
      'footer',
    ]),
  },
  {
    id: 'saas-landing',
    title: 'SaaS Landing',
    description: 'High-converting SaaS landing page layout.',
    category: 'Full Pages',
    tags: ['saas', 'landing', 'marketing'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=SaaS+Landing',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Property-focused page with listings and social proof blocks.',
    category: 'Full Pages',
    tags: ['real-estate', 'agency', 'listings'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Real+Estate',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
  {
    id: 'agency',
    title: 'Agency',
    description: 'Services-led layout with testimonials and clear CTA sections.',
    category: 'Full Pages',
    tags: ['agency', 'services', 'portfolio'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Agency',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
  {
    id: 'ecommerce',
    title: 'Ecommerce',
    description: 'Product-forward layout with cards and pricing blocks.',
    category: 'Full Pages',
    tags: ['ecommerce', 'store', 'products'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Ecommerce',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Personal portfolio starter with cards and testimonials sections.',
    category: 'Full Pages',
    tags: ['portfolio', 'personal', 'creative'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Portfolio',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
  {
    id: 'startup',
    title: 'Startup',
    description: 'Startup-ready homepage with pricing and FAQ baked in.',
    category: 'Full Pages',
    tags: ['startup', 'launch', 'marketing'],
    thumbnail: 'https://via.placeholder.com/1200x720?text=Startup',
    responsiveReady: true,
    roots: composeSections(['header', 'hero', 'features', 'cards', 'testimonials', 'pricing', 'faq', 'cta', 'footer']),
  },
];

export function getFullPageTemplateById(id) {
  const key = String(id || '');
  return FULL_PAGE_TEMPLATES.find((t) => t.id === key) || null;
}

