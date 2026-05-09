import { registerApp, registerCmsCollection, registerTemplate, registerWidget } from '../../lib/registry/appRegistry.js';

const appId = registerApp({
  id: 'ecommerce-app',
  name: 'Ecommerce App',
  version: '0.1.0',
  capabilities: ['widgets', 'templates', 'cms_access'],
  description: 'Ecommerce presets: collections + templates + widget defaults',
});

// CMS collection preset (does not create tables; just schema preset for UI/seed)
registerCmsCollection(appId, {
  slug: 'products',
  name: 'Products',
  schema: {
    fields: [
      { id: 'price', label: 'Price', type: 'number' },
      { id: 'image', label: 'Image', type: 'image' },
      { id: 'category', label: 'Category', type: 'text' },
      { id: 'tags', label: 'Tags', type: 'select', multiple: true },
      { id: 'featured', label: 'Featured', type: 'boolean' },
    ],
  },
});

// Widget defaults (must be existing core-rendered types)
registerWidget(appId, 'website', {
  type: 'button',
  label: 'Buy button (preset)',
  allowedParents: ['stack'],
  defaultProps: { text: 'Add to cart', href: '/cart' },
  supportsData: false,
  supportsActions: true,
});

// Template descriptor placeholder (consumer integration comes later)
registerTemplate(appId, {
  id: 'ecom.product-grid.section',
  kind: 'section',
  title: 'Product grid',
  category: 'Ecommerce',
  tags: ['products', 'grid'],
});

