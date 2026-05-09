import { registerApp, registerCmsCollection, registerTemplate } from '../../lib/registry/appRegistry.js';

const appId = registerApp({
  id: 'real-estate-app',
  name: 'Real Estate App',
  version: '0.1.0',
  capabilities: ['templates', 'cms_access'],
  description: 'Real estate presets: properties schema + templates',
});

registerCmsCollection(appId, {
  slug: 'properties',
  name: 'Properties',
  schema: {
    fields: [
      { id: 'price', label: 'Price', type: 'number' },
      { id: 'address', label: 'Address', type: 'text' },
      { id: 'beds', label: 'Beds', type: 'number' },
      { id: 'baths', label: 'Baths', type: 'number' },
      { id: 'image', label: 'Hero image', type: 'image' },
      { id: 'tags', label: 'Tags', type: 'select', multiple: true },
      { id: 'featured', label: 'Featured', type: 'boolean' },
    ],
  },
});

registerTemplate(appId, {
  id: 're.property-cards.section',
  kind: 'section',
  title: 'Property cards',
  category: 'Real Estate',
  tags: ['properties', 'cards'],
});

