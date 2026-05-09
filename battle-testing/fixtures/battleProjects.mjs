/**
 * Production-style battle-test page trees + CMS metadata.
 * Consumed by scripts/battle-test-seed.mjs (MySQL seed, idempotent per project slug).
 */

const IMG = {
  hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
  truck: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
  shop: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80',
};

function stackSection(displayName, stackChildren) {
  return {
    nodeType: 'row',
    displayName,
    props: { style_json: {} },
    children: [
      {
        nodeType: 'column',
        displayName: 'Column',
        props: { style_json: {} },
        children: [
          {
            nodeType: 'stack',
            displayName: 'Stack',
            props: { style_json: {} },
            children: stackChildren,
          },
        ],
      },
    ],
  };
}

function heading({ text, tag = 'h2' }) {
  return {
    nodeType: 'heading',
    displayName: 'Heading',
    props: { text, tag, style_json: {} },
    children: [],
  };
}

function richText(html) {
  return {
    nodeType: 'rich_text',
    displayName: 'Rich text',
    props: { content: html, animation: { preset: 'none', duration: 0.6, delay: 0 }, style_json: {} },
    children: [],
  };
}

function imageBlock(src, alt) {
  return {
    nodeType: 'image',
    displayName: 'Image',
    props: { src, alt: alt || '', style_json: {} },
    children: [],
  };
}

function btn(text, href = '#') {
  return {
    nodeType: 'button',
    displayName: 'Button',
    props: { text, href, type: 'default', style_json: {} },
    children: [],
  };
}

function menuNav() {
  return {
    nodeType: 'menu',
    displayName: 'Primary nav',
    props: {
      ariaLabel: 'Primary navigation',
      variant: 'pill',
      align: 'left',
      items: [
        { label: 'Home', to: '/' },
        { label: 'Listings', to: '/home' },
        { label: 'Contact', to: '/home' },
      ],
      style_json: {},
    },
    children: [],
  };
}

function carouselBlock() {
  return {
    nodeType: 'carousel',
    displayName: 'Hero carousel',
    props: {
      variant: 'hero',
      autoplay: true,
      loop: true,
      showArrows: true,
      showDots: true,
      speed: 500,
      interval: 4000,
      slidesPerView: { desktop: 1, tablet: 1, mobile: 1 },
      gap: 16,
      slides: [
        {
          id: 's1',
          title: 'Slide one',
          subtitle: 'Production-style content',
          image: IMG.hero,
          imageSrc: IMG.hero,
          imageAlt: 'Modern interior',
          buttonText: 'Learn more',
          buttonUrl: '#',
        },
        {
          id: 's2',
          title: 'Slide two',
          subtitle: 'Carousel CLS checks',
          image: IMG.office,
          imageSrc: IMG.office,
          imageAlt: 'Office workspace',
          buttonText: 'View details',
          buttonUrl: '#',
        },
      ],
      style_json: {},
    },
    children: [],
  };
}

function leadForm(submitLabel, fields) {
  return {
    nodeType: 'form',
    displayName: 'Lead form',
    props: {
      submitLabel,
      fields,
      notifications: { webhookUrl: '', emailTo: '' },
      style_json: {},
    },
    dataJson: {
      source: {
        kind: 'internal_api',
        resource: 'form_submissions',
        path: '/api/forms/submit',
        method: 'POST',
      },
    },
    children: [],
  };
}

function cmsRepeater(collectionSlug, limit, cardChildren) {
  return {
    nodeType: 'stack',
    displayName: 'CMS repeater',
    props: {
      style_json: {},
      meta: {
        cms: {
          repeat: { collectionSlug, limit, sortBy: 'published_at' },
        },
      },
    },
    children: [
      {
        nodeType: 'stack',
        displayName: 'Card template',
        props: { style_json: {} },
        children: cardChildren,
      },
    ],
  };
}

function baseSeo(title, description, extras = {}) {
  return {
    title,
    description,
    canonicalUrl: '',
    noindex: false,
    schemaJsonLd: extras.schemaJsonLd ?? null,
  };
}

export const BATTLE_PROJECTS = [
  {
    slug: 'battle-real-estate',
    name: 'Battle · Real Estate',
    type: 'website',
    appIds: ['real-estate-app'],
    configJson: {
      seo: {
        canonicalDomain: 'https://battle-real-estate.example',
        siteTitle: 'Battle Real Estate',
        defaultDescription: 'Battle-test MLS-style listings and property templates.',
      },
    },
    cmsCollections: [
      {
        slug: 'properties',
        name: 'Properties',
        schema: {
          fields: [
            { id: 'price', label: 'Price', type: 'number' },
            { id: 'address', label: 'Address', type: 'text' },
            { id: 'beds', label: 'Beds', type: 'number' },
            { id: 'image', label: 'Hero image', type: 'image' },
          ],
        },
      },
    ],
    cmsItems: [
      {
        collectionSlug: 'properties',
        slug: 'oak-lane',
        title: 'Oak Lane Townhome',
        status: 'published',
        data: { price: 685000, address: '120 Oak Lane, Austin', beds: 3, image: IMG.hero },
      },
      {
        collectionSlug: 'properties',
        slug: 'river-view',
        title: 'River View Condo',
        status: 'published',
        data: { price: 512000, address: '88 River Rd, Austin', beds: 2, image: IMG.office },
      },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        seo: baseSeo(
          'Battle Real Estate — Find your next home',
          'Browse curated listings with CMS-driven cards, forms, and responsive layouts.'
        ),
        sections: [
          stackSection('Nav', [menuNav(), btn('Book a tour', '#')]),
          stackSection('Hero', [
            heading({ text: 'Homes that fit real life', tag: 'h1' }),
            richText('<p>Stress-test: navigation, hero, carousel, CMS repeater, and lead capture.</p>'),
            imageBlock(IMG.hero, 'Residential exterior hero'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Listings', [
            heading({ text: 'Featured properties', tag: 'h2' }),
            cmsRepeater('properties', 6, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.address}} · ${{item.data.price}} · {{item.data.beds}} bd</p>'),
              imageBlock('{{item.data.image}}', '{{item.title}}'),
            ]),
          ]),
          stackSection('Lead', [
            heading({ text: 'Talk to an agent', tag: 'h2' }),
            leadForm('Request showing', [
              { name: 'name', label: 'Full name', type: 'text', required: true },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'notes', label: 'Budget / timeline', type: 'text', required: false },
            ]),
          ]),
        ],
      },
      {
        slug: 'property-detail',
        title: 'Property detail',
        seo: baseSeo(
          '{{item.title}} — Battle Real Estate',
          '{{item.data.address}} · Listing detail template for dynamic /property/[slug] routes.',
          {
            schemaJsonLd: {
              '@context': 'https://schema.org',
              '@type': 'RealEstateListing',
              name: '{{item.title}}',
            },
          }
        ),
        sections: [
          stackSection('Property header', [
            heading({ text: '{{item.title}}', tag: 'h1' }),
            richText('<p>{{item.data.address}}</p><p>Price: ${{item.data.price}}</p>'),
            imageBlock('{{item.data.image}}', '{{item.title}}'),
          ]),
          stackSection('Detail CTA', [btn('Schedule tour', '#')]),
        ],
      },
    ],
  },
  {
    slug: 'battle-ecommerce',
    name: 'Battle · Ecommerce',
    type: 'website',
    appIds: ['ecommerce-app'],
    configJson: {
      seo: {
        canonicalDomain: 'https://battle-ecommerce.example',
        siteTitle: 'Battle Shop',
        defaultDescription: 'Catalog CMS + carousel + checkout-oriented forms.',
      },
    },
    cmsCollections: [
      {
        slug: 'products',
        name: 'Products',
        schema: {
          fields: [
            { id: 'price', label: 'Price', type: 'number' },
            { id: 'category', label: 'Category', type: 'text' },
            { id: 'image', label: 'Image', type: 'image' },
          ],
        },
      },
    ],
    cmsItems: [
      {
        collectionSlug: 'products',
        slug: 'desk-lamp',
        title: 'Desk Lamp Pro',
        status: 'published',
        data: { price: 89, category: 'Lighting', image: IMG.shop },
      },
      {
        collectionSlug: 'products',
        slug: 'noise-headphones',
        title: 'Noise-Cancel Headphones',
        status: 'published',
        data: { price: 249, category: 'Audio', image: IMG.hero },
      },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        seo: baseSeo('Battle Shop — Featured products', 'Ecommerce battle page with CMS product grid.'),
        sections: [
          stackSection('Nav', [menuNav(), btn('View cart', '#')]),
          stackSection('Hero', [
            heading({ text: 'Built for conversion testing', tag: 'h1' }),
            richText('<p>Carousel, product repeater, and lead capture in one flow.</p>'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Products', [
            heading({ text: 'Popular picks', tag: 'h2' }),
            cmsRepeater('products', 8, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.category}} · ${{item.data.price}}</p>'),
              imageBlock('{{item.data.image}}', '{{item.title}}'),
              {
                nodeType: 'button',
                displayName: 'View product',
                props: {
                  text: 'View product',
                  href: '/product/{{sys.slug}}',
                  type: 'default',
                  style_json: {},
                },
                children: [],
              },
              btn('Add to cart', '#'),
            ]),
          ]),
          stackSection('Newsletter', [
            leadForm('Subscribe', [
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'source', label: 'Where did you hear us?', type: 'text', required: false },
            ]),
          ]),
        ],
      },
      {
        slug: 'product-detail',
        title: 'Product detail',
        seo: baseSeo(
          '{{item.title}} — Battle Shop',
          '{{item.data.category}} · ${{item.data.price}} — PDP template for /product/[slug].',
          {
            schemaJsonLd: {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: '{{item.title}}',
            },
          }
        ),
        sections: [
          stackSection('Product hero', [
            heading({ text: '{{item.title}}', tag: 'h1' }),
            richText('<p>{{item.data.category}} · ${{item.data.price}}</p>'),
            imageBlock('{{item.data.image}}', '{{item.title}}'),
            btn('Add to cart', '#'),
          ]),
        ],
      },
    ],
  },
  {
    slug: 'battle-logistics',
    name: 'Battle · Logistics',
    type: 'website',
    appIds: ['logistics-app'],
    configJson: {
      seo: {
        canonicalDomain: 'https://battle-logistics.example',
        siteTitle: 'Battle Logistics',
        defaultDescription: 'Shipment tracking style CMS content.',
      },
    },
    cmsCollections: [
      {
        slug: 'shipments',
        name: 'Shipments',
        schema: {
          fields: [
            { id: 'tracking', label: 'Tracking #', type: 'text' },
            { id: 'status', label: 'Status', type: 'text' },
            { id: 'eta', label: 'ETA', type: 'text' },
          ],
        },
      },
    ],
    cmsItems: [
      {
        collectionSlug: 'shipments',
        slug: 'SHP-1001',
        title: 'Shipment SHP-1001',
        status: 'published',
        data: { tracking: 'SHP-1001', status: 'In transit', eta: 'May 12' },
      },
      {
        collectionSlug: 'shipments',
        slug: 'SHP-1002',
        title: 'Shipment SHP-1002',
        status: 'published',
        data: { tracking: 'SHP-1002', status: 'Delivered', eta: 'May 9' },
      },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        seo: baseSeo('Battle Logistics — Operations dashboard', 'Track-style CMS rows + operational CTAs.'),
        sections: [
          stackSection('Nav', [menuNav(), btn('Open portal', '#')]),
          stackSection('Hero', [
            heading({ text: 'Freight visibility without guesswork', tag: 'h1' }),
            richText('<p>Repeater tuned for operational density and mobile wrapping.</p>'),
            imageBlock(IMG.truck, 'Freight truck'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Shipments', [
            heading({ text: 'Active shipments', tag: 'h2' }),
            cmsRepeater('shipments', 12, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>Tracking: {{item.data.tracking}} — {{item.data.status}} (ETA {{item.data.eta}})</p>'),
            ]),
          ]),
          stackSection('Quote', [
            leadForm('Request quote', [
              { name: 'company', label: 'Company', type: 'text', required: true },
              { name: 'email', label: 'Email', type: 'email', required: true },
              { name: 'lanes', label: 'Lanes / volume', type: 'textarea', required: false },
            ]),
          ]),
        ],
      },
    ],
  },
  {
    slug: 'battle-saas',
    name: 'Battle · SaaS',
    type: 'website',
    appIds: [],
    configJson: {
      seo: {
        canonicalDomain: 'https://battle-saas.example',
        siteTitle: 'Battle SaaS',
        defaultDescription: 'Marketing site pattern: blog template + product story.',
      },
    },
    cmsCollections: [
      {
        slug: 'blog',
        name: 'Blog',
        schema: {
          fields: [
            { id: 'summary', label: 'Summary', type: 'text' },
            { id: 'cover', label: 'Cover', type: 'image' },
          ],
        },
      },
    ],
    cmsItems: [
      {
        collectionSlug: 'blog',
        slug: 'launch-checklist',
        title: 'Launch checklist for teams',
        status: 'published',
        data: {
          summary: 'What we verified before shipping v1.',
          cover: IMG.office,
        },
      },
      {
        collectionSlug: 'blog',
        slug: 'pricing-experiments',
        title: 'Pricing experiments that survived battle testing',
        status: 'published',
        data: {
          summary: 'Lessons from staged rollouts.',
          cover: IMG.hero,
        },
      },
    ],
    pages: [
      {
        slug: 'home',
        title: 'Home',
        seo: baseSeo('Battle SaaS — Ship reliable software', 'Landing story + carousel + resources.'),
        sections: [
          stackSection('Nav', [menuNav(), btn('Start trial', '#')]),
          stackSection('Hero', [
            heading({ text: 'Operational SaaS without drama', tag: 'h1' }),
            richText('<p>Forms, audits, SEO, and CMS-backed articles.</p>'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Latest posts', [
            heading({ text: 'From the blog', tag: 'h2' }),
            cmsRepeater('blog', 6, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.summary}}</p>'),
              imageBlock('{{item.data.cover}}', '{{item.title}}'),
            ]),
          ]),
          stackSection('Demo request', [
            leadForm('Get a demo', [
              { name: 'work_email', label: 'Work email', type: 'email', required: true },
              { name: 'team_size', label: 'Team size', type: 'text', required: false },
            ]),
          ]),
        ],
      },
      {
        slug: 'blog-post',
        title: 'Blog post',
        seo: baseSeo('{{item.title}} — Battle SaaS', '{{item.data.summary}}'),
        sections: [
          stackSection('Article', [
            heading({ text: '{{item.title}}', tag: 'h1' }),
            richText('<p>{{item.data.summary}}</p>'),
            imageBlock('{{item.data.cover}}', '{{item.title}}'),
          ]),
        ],
      },
    ],
  },
];
