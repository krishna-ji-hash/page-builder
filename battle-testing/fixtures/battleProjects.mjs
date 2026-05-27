/**
 * Production-style battle-test page trees + CMS metadata.
 * Consumed by scripts/battle-test-seed.mjs (MySQL seed, idempotent per project slug).
 */

const IMG = {
  hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=75',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=75',
  truck: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=75',
  shop: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=75',
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

function heading({ text, tag = 'h2', style_json = {} }) {
  return {
    nodeType: 'heading',
    displayName: 'Heading',
    props: { text, tag, style_json },
    children: [],
  };
}

function heroHeading(text) {
  return heading({
    text,
    tag: 'h1',
    style_json: {
      interactions: {
        animation: { preset: 'fade', trigger: 'on-scroll', duration: 0.45, easing: 'ease-out' },
      },
    },
  });
}

function ctaButton(text, href = '#') {
  const node = btn(text, href);
  node.props.style_json = {
    interactions: {
      hover: { scale: '1.01', boxShadow: '0 4px 16px rgba(15,23,42,0.08)' },
      active: { scale: '0.99' },
    },
  };
  return node;
}

function seoLandingPage({ slug, title, seoTitle, seoDescription, heroTitle, heroHtml, ctaLabel, image = IMG.hero }) {
  return {
    slug,
    title,
    seo: baseSeo(seoTitle, seoDescription),
    sections: [
      stackSection('Nav', [menuNav(), ctaButton(ctaLabel, '#')]),
      stackSection('Hero', [
        heroHeading(heroTitle),
        richText(heroHtml),
        imageBlock(image, heroTitle, { imageHeightPx: 420, aspectRatio: '16 / 9' }),
        ctaButton('Get started', '#'),
      ]),
      stackSection('Proof', [
        heading({ text: 'Built for production battle testing', tag: 'h2' }),
        richText(
          '<p>Responsive layout, CMS routes, forms, carousel, interactions, and SEO metadata — validated on every deploy.</p>'
        ),
      ]),
      stackSection('Lead', [
        heading({ text: 'Talk to our team', tag: 'h2' }),
        leadForm('Send message', [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'message', label: 'Message', type: 'textarea', required: false },
        ]),
      ]),
    ],
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

function imageBlock(src, alt, { imageHeightPx = 400, aspectRatio = '16 / 9' } = {}) {
  return {
    nodeType: 'image',
    displayName: 'Image',
    props: {
      src,
      alt: alt || '',
      imageFit: 'cover',
      imageHeightPx,
      style_json: {
        desktop: {
          size: { width: '100%', aspectRatio },
        },
      },
    },
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
          imageHeightPx: 420,
          imageWidthPx: 1200,
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
          imageHeightPx: 420,
          imageWidthPx: 1200,
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
            heroHeading('Homes that fit real life'),
            richText('<p>Stress-test: navigation, hero, carousel, CMS repeater, and lead capture.</p>'),
            imageBlock(IMG.hero, 'Residential exterior hero', { imageHeightPx: 480, aspectRatio: '16 / 9' }),
            ctaButton('Browse listings', '#'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Listings', [
            heading({ text: 'Featured properties', tag: 'h2' }),
            cmsRepeater('properties', 4, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.address}} · ${{item.data.price}} · {{item.data.beds}} bd</p>'),
              imageBlock('{{item.data.image}}', '{{item.title}}', { imageHeightPx: 200, aspectRatio: '4 / 3' }),
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
            imageBlock('{{item.data.image}}', '{{item.title}}', { imageHeightPx: 360, aspectRatio: '4 / 3' }),
          ]),
          stackSection('Detail CTA', [btn('Schedule tour', '#')]),
        ],
      },
      seoLandingPage({
        slug: 'austin-luxury-homes',
        title: 'Austin luxury homes',
        seoTitle: 'Austin luxury homes — Battle Real Estate',
        seoDescription: 'SEO landing page for high-intent local search: luxury homes in Austin with lead capture.',
        heroTitle: 'Luxury homes in Austin',
        heroHtml: '<p>Long-tail SEO landing with hero animation, hover CTAs, and conversion form.</p>',
        ctaLabel: 'Book tour',
        image: IMG.office,
      }),
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
            heroHeading('Built for conversion testing'),
            richText('<p>Carousel, product repeater, and lead capture in one flow.</p>'),
            ctaButton('Shop now', '#'),
          ]),
          stackSection('Carousel', [carouselBlock()]),
          stackSection('Products', [
            heading({ text: 'Popular picks', tag: 'h2' }),
            cmsRepeater('products', 4, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.category}} · ${{item.data.price}}</p>'),
              imageBlock('{{item.data.image}}', '{{item.title}}', { imageHeightPx: 200, aspectRatio: '4 / 3' }),
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
            imageBlock('{{item.data.image}}', '{{item.title}}', { imageHeightPx: 360, aspectRatio: '4 / 3' }),
            btn('Add to cart', '#'),
          ]),
        ],
      },
      seoLandingPage({
        slug: 'summer-sale',
        title: 'Summer sale',
        seoTitle: 'Summer sale — Battle Shop',
        seoDescription: 'Campaign landing page for seasonal ecommerce SEO and PDP deep links.',
        heroTitle: 'Summer sale — up to 40% off',
        heroHtml: '<p>Test seasonal landing pages with product grid links and newsletter signup.</p>',
        ctaLabel: 'View deals',
        image: IMG.shop,
      }),
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
            heroHeading('Freight visibility without guesswork'),
            richText('<p>Repeater tuned for operational density and mobile wrapping.</p>'),
            imageBlock(IMG.truck, 'Freight truck', { imageHeightPx: 400, aspectRatio: '16 / 9' }),
            ctaButton('Track shipment', '#'),
          ]),
          stackSection('Shipments', [
            heading({ text: 'Active shipments', tag: 'h2' }),
            cmsRepeater('shipments', 6, [
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
      seoLandingPage({
        slug: 'cross-border-freight',
        title: 'Cross-border freight',
        seoTitle: 'Cross-border freight — Battle Logistics',
        seoDescription: 'SEO landing for international freight quotes and operational lead forms.',
        heroTitle: 'Cross-border freight without delays',
        heroHtml: '<p>Validate logistics SEO pages, dense repeaters on home, and quote forms on landing URLs.</p>',
        ctaLabel: 'Get quote',
        image: IMG.truck,
      }),
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
            cmsRepeater('blog', 4, [
              heading({ text: '{{item.title}}', tag: 'h3' }),
              richText('<p>{{item.data.summary}}</p>'),
              imageBlock('{{item.data.cover}}', '{{item.title}}', { imageHeightPx: 180, aspectRatio: '16 / 9' }),
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
            imageBlock('{{item.data.cover}}', '{{item.title}}', { imageHeightPx: 360, aspectRatio: '16 / 9' }),
          ]),
        ],
      },
    ],
  },
];
