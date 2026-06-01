/**
 * Industry blueprints for the project creation wizard and template deployment engine.
 * Page slugs and section template keys map to SECTION_TEMPLATES in sectionTemplates.js.
 */

export const WIZARD_INDUSTRIES = [
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'saas', label: 'SaaS' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'custom', label: 'Custom' },
];

export const WIZARD_THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'custom', label: 'Custom' },
];

/** @typedef {{ slug: string, title: string, sections: string[], seoTitle?: string, seoDescription?: string }} BlueprintPage */

/** @type {Record<string, { pages: BlueprintPage[], cmsCollections?: object[], defaultTemplateId?: string }>} */
export const INDUSTRY_BLUEPRINTS = {
  'real-estate': {
    defaultTemplateId: 'real-estate-starter',
    pages: [
      { slug: 'home', title: 'Home', sections: ['heroLanding', 'platformHero', 'contactForm'] },
      { slug: 'about', title: 'About', sections: ['hero', 'platformHero'] },
      { slug: 'properties', title: 'Properties', sections: ['hero', 'pricing'] },
      { slug: 'contact', title: 'Contact', sections: ['contactForm'] },
      { slug: 'faq', title: 'FAQ', sections: ['hero', 'pricing'] },
    ],
    cmsCollections: [
      { name: 'Properties', slug: 'properties', type: 'listing' },
      { name: 'Agents', slug: 'agents', type: 'team' },
    ],
  },
  ecommerce: {
    defaultTemplateId: 'ecommerce-starter',
    pages: [
      { slug: 'home', title: 'Home', sections: ['heroLanding', 'platformHero', 'pricing'] },
      { slug: 'categories', title: 'Categories', sections: ['hero', 'pricing'] },
      { slug: 'product', title: 'Product Detail', sections: ['hero', 'splitHeroCarousel'] },
      { slug: 'contact', title: 'Contact', sections: ['contactForm'] },
    ],
    cmsCollections: [
      { name: 'Products', slug: 'products', type: 'product' },
      { name: 'Categories', slug: 'categories', type: 'taxonomy' },
    ],
  },
  logistics: {
    defaultTemplateId: 'logistics-starter',
    pages: [
      { slug: 'home', title: 'Home', sections: ['heroLanding', 'platformHero'] },
      { slug: 'services', title: 'Services', sections: ['hero', 'pricing'] },
      { slug: 'tracking', title: 'Tracking', sections: ['hero', 'contactForm'] },
      { slug: 'pricing', title: 'Pricing', sections: ['pricing'] },
      { slug: 'contact', title: 'Contact', sections: ['contactForm'] },
    ],
    cmsCollections: [{ name: 'Shipments', slug: 'shipments', type: 'tracking' }],
  },
  saas: {
    defaultTemplateId: 'saas-starter',
    pages: [
      { slug: 'home', title: 'Home', sections: ['heroLanding', 'platformHero', 'pricing'] },
      { slug: 'features', title: 'Features', sections: ['platformHero', 'splitHeroCarousel'] },
      { slug: 'pricing', title: 'Pricing', sections: ['pricing'] },
      { slug: 'faq', title: 'FAQ', sections: ['hero', 'pricing'] },
      { slug: 'contact', title: 'Contact', sections: ['contactForm'] },
    ],
    cmsCollections: [{ name: 'Changelog', slug: 'changelog', type: 'blog' }],
  },
  portfolio: {
    defaultTemplateId: 'portfolio-starter',
    pages: [
      { slug: 'home', title: 'Home', sections: ['hero', 'platformHero'] },
      { slug: 'work', title: 'Work', sections: ['hero', 'splitHeroCarousel'] },
      { slug: 'about', title: 'About', sections: ['hero'] },
      { slug: 'contact', title: 'Contact', sections: ['contactForm'] },
    ],
    cmsCollections: [{ name: 'Projects', slug: 'projects', type: 'portfolio' }],
  },
  custom: {
    defaultTemplateId: 'custom-starter',
    pages: [{ slug: 'home', title: 'Home', sections: ['hero'] }],
    cmsCollections: [],
  },
};

export function getIndustryBlueprint(industryId) {
  const key = String(industryId || 'custom').trim();
  return INDUSTRY_BLUEPRINTS[key] || INDUSTRY_BLUEPRINTS.custom;
}

export function listWizardTemplateOptions(industryId) {
  const blueprint = getIndustryBlueprint(industryId);
  return [
    {
      id: blueprint.defaultTemplateId || `${industryId}-starter`,
      label: `${industryId.replace(/-/g, ' ')} starter`,
      pageCount: blueprint.pages.length,
      pages: blueprint.pages.map((p) => ({ slug: p.slug, title: p.title })),
    },
  ];
}
