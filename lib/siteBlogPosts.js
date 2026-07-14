/**
 * Site blog posts — single source for /blog listing, /blog/[slug] detail, and builder defaults.
 */

/** @typedef {{ heading: string, text: string }} BlogContentBlock */

/**
 * @typedef {Object} SiteBlogPost
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} readTime
 * @property {string} [publishedDate]
 * @property {string} image
 * @property {BlogContentBlock[]} content
 * @property {string} [categoryId]
 */

/** @type {Record<string, SiteBlogPost>} */
export const SITE_BLOG_POSTS = {
  'what-is-logistics-aggregator': {
    slug: 'what-is-logistics-aggregator',
    categoryId: 'shipping-guide',
    category: 'Shipping Guide',
    readTime: '5 min read',
    publishedDate: 'May 20, 2026',
    title: 'What is a Logistics Aggregator and How Does It Work?',
    description:
      'Understand how logistics aggregators help businesses compare courier partners, automate AWB generation and simplify shipping.',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'What is a logistics aggregator?',
        text: 'A logistics aggregator is a platform that connects businesses with multiple courier partners from one dashboard. Instead of managing each courier separately, businesses can compare rates, check serviceability, generate AWB, print labels and track shipments from a single system.',
      },
      {
        heading: 'How does it help eCommerce businesses?',
        text: 'It helps online sellers reduce manual work, improve delivery speed, compare courier performance and manage orders more efficiently. Businesses can select courier partners based on price, delivery TAT, pin code coverage, COD availability and shipment priority.',
      },
      {
        heading: 'Why Dispatch Solutions?',
        text: 'Dispatch Solutions helps businesses manage courier allocation, tracking, COD, wallet, billing and integrations from one logistics dashboard.',
      },
    ],
  },
  'cod-remittance-ecommerce-shipping': {
    slug: 'cod-remittance-ecommerce-shipping',
    categoryId: 'cod-wallet',
    category: 'COD & Wallet',
    readTime: '6 min read',
    publishedDate: 'May 18, 2026',
    title: 'How COD Remittance Works in eCommerce Shipping',
    description:
      'Learn how COD collection, reconciliation and remittance are managed inside a logistics dashboard.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'What is COD remittance?',
        text: 'COD remittance is the process where the courier partner collects cash from the buyer and later transfers the collected amount to the seller or business account after reconciliation.',
      },
      {
        heading: 'Why COD reconciliation is important?',
        text: 'COD reconciliation helps businesses verify collected amount, delivery status, pending remittance, remitted amount and deductions. This reduces payment mismatch and improves financial control.',
      },
      {
        heading: 'How Dispatch Solutions helps',
        text: 'Dispatch Solutions provides COD reports, remittance visibility, wallet deduction details and courier-wise reconciliation to help businesses manage COD operations smoothly.',
      },
    ],
  },
  'real-time-shipment-tracking': {
    slug: 'real-time-shipment-tracking',
    categoryId: 'tracking',
    category: 'Tracking',
    readTime: '4 min read',
    publishedDate: 'May 15, 2026',
    title: 'Why Real-Time Shipment Tracking Matters',
    description:
      'Discover how tracking visibility improves customer experience and reduces support queries.',
    image:
      'https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'Why shipment tracking is important',
        text: 'Real-time tracking helps businesses and customers know where the shipment is, whether it is picked up, in transit, out for delivery, delivered or returned.',
      },
      {
        heading: 'How tracking reduces support load',
        text: 'When tracking updates are available clearly, customers do not need to call support repeatedly. This improves customer experience and reduces operational pressure.',
      },
      {
        heading: 'Tracking with Dispatch Solutions',
        text: 'Dispatch Solutions helps businesses track shipments across courier partners from one dashboard using AWB or LR number.',
      },
    ],
  },
  'shopify-courier-integration': {
    slug: 'shopify-courier-integration',
    categoryId: 'integrations',
    category: 'Integrations',
    readTime: '5 min read',
    publishedDate: 'May 12, 2026',
    title: 'Shopify Courier Integration: Complete Guide',
    description: 'Learn how Shopify orders can sync automatically with your shipping dashboard.',
    image:
      'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'What is Shopify courier integration?',
        text: 'Shopify courier integration allows Shopify orders to sync automatically with a logistics dashboard so sellers can generate AWB, print labels and ship orders faster.',
      },
      {
        heading: 'Benefits of integration',
        text: 'It reduces manual order entry, prevents data errors, speeds up dispatch operations and gives better visibility over order fulfillment.',
      },
      {
        heading: 'Dispatch Solutions integration',
        text: 'Dispatch Solutions can help businesses connect Shopify with courier partners and manage shipping from one centralized dashboard.',
      },
    ],
  },
  'reduce-rto-ecommerce-logistics': {
    slug: 'reduce-rto-ecommerce-logistics',
    categoryId: 'ecommerce',
    category: 'eCommerce',
    readTime: '6 min read',
    publishedDate: 'May 10, 2026',
    title: 'How to Reduce RTO in eCommerce Logistics',
    description:
      'Practical methods to reduce return-to-origin using NDR follow-ups, address validation and courier data.',
    image:
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'What is RTO?',
        text: 'RTO means Return to Origin. It happens when a shipment is not delivered to the customer and is returned back to the seller.',
      },
      {
        heading: 'How to reduce RTO',
        text: 'Businesses can reduce RTO by validating addresses, confirming COD orders, using NDR follow-ups, selecting better courier partners and monitoring courier performance.',
      },
      {
        heading: 'How Dispatch Solutions helps',
        text: 'Dispatch Solutions helps businesses monitor shipment status, track NDR cases and use courier performance data to reduce unnecessary returns.',
      },
    ],
  },
  'courier-rate-comparison': {
    slug: 'courier-rate-comparison',
    categoryId: 'courier-partners',
    category: 'Courier Partners',
    readTime: '6 min read',
    publishedDate: 'May 8, 2026',
    title: 'Courier Rate Comparison: Cheapest vs Fastest Shipping',
    description:
      'Compare courier selection methods based on cost, delivery TAT, pin code serviceability and shipment priority.',
    image:
      'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1200&q=80',
    content: [
      {
        heading: 'Cheapest courier is not always best',
        text: 'Low-cost courier options can reduce shipping cost, but they may not always provide the best delivery speed, serviceability or customer experience.',
      },
      {
        heading: 'Fastest courier selection',
        text: 'Fastest courier selection is useful for urgent shipments, premium customers and time-sensitive deliveries where delivery speed matters more than cost.',
      },
      {
        heading: 'Smart courier recommendation',
        text: 'Dispatch Solutions can help businesses choose courier partners based on price, delivery TAT, zone, pin code serviceability, COD availability and shipment priority.',
      },
    ],
  },
};

function slugifyBlogTitle(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || ''
  );
}

export function getSiteBlogPost(slug) {
  return resolveSiteBlogPost(slug);
}

/** Resolve by canonical slug, title slug, or partial title slug from listing links. */
export function resolveSiteBlogPost(slug) {
  const raw = String(slug || '').trim();
  if (!raw) return null;
  if (SITE_BLOG_POSTS[raw]) return SITE_BLOG_POSTS[raw];

  const lowered = raw.toLowerCase();
  for (const post of Object.values(SITE_BLOG_POSTS)) {
    if (post.slug === raw || post.slug.toLowerCase() === lowered) return post;
    if (slugifyBlogTitle(post.title) === lowered) return post;
    if (lowered.startsWith(`${post.slug.toLowerCase()}-`)) return post;
    if (lowered.includes(post.slug.toLowerCase())) return post;
  }
  return null;
}

export function findSiteBlogPostByTitle(title) {
  const target = String(title || '').trim().toLowerCase();
  if (!target) return null;
  return (
    getAllSiteBlogPosts().find((post) => String(post.title || '').trim().toLowerCase() === target) ||
    null
  );
}

export function getAllSiteBlogPosts() {
  return Object.values(SITE_BLOG_POSTS);
}

export function siteBlogPostPublishedDate(post) {
  return String(post?.publishedDate || 'May 20, 2026').trim();
}

export function siteBlogPostHref(slug) {
  return `/blog/${String(slug || '').trim()}`;
}

/** Map site posts into blog_full_page widget post shape. */
export function siteBlogPostsForBuilderWidget() {
  return getAllSiteBlogPosts().map((post, index) => ({
    id: `post-${index + 1}`,
    slug: post.slug,
    category: post.categoryId || 'shipping-guide',
    readTime: post.readTime,
    publishedDate: siteBlogPostPublishedDate(post),
    title: post.title,
    description: post.description,
    body: post.content.map((block) => `${block.heading}\n\n${block.text}`).join('\n\n'),
    image: post.image,
    href: siteBlogPostHref(post.slug),
  }));
}
