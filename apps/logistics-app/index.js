import { registerApp, registerCmsCollection, registerTemplate } from '../../lib/registry/appRegistry.js';

const appId = registerApp({
  id: 'logistics-app',
  name: 'Logistics App',
  version: '0.1.0',
  capabilities: ['templates', 'cms_access'],
  description: 'Logistics presets: shipments schema + templates',
});

registerCmsCollection(appId, {
  slug: 'shipments',
  name: 'Shipments',
  schema: {
    fields: [
      { id: 'tracking', label: 'Tracking #', type: 'text' },
      { id: 'status', label: 'Status', type: 'select' },
      { id: 'eta', label: 'ETA', type: 'date' },
      { id: 'featured', label: 'Featured', type: 'boolean' },
    ],
  },
});

registerTemplate(appId, {
  id: 'log.shipment-status.section',
  kind: 'section',
  title: 'Shipment status',
  category: 'Logistics',
  tags: ['status', 'tracking'],
});

