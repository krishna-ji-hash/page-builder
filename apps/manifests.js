export const APP_MANIFESTS = [
  {
    id: 'ecommerce-app',
    name: 'Ecommerce App',
    description: 'Ecommerce presets: collections + templates + widget defaults',
    version: '0.1.0',
    capabilities: ['widgets', 'templates', 'cms_access'],
    icon: '🛒',
    import: () => import('./ecommerce-app/index.js'),
  },
  {
    id: 'real-estate-app',
    name: 'Real Estate App',
    description: 'Real estate presets: properties schema + templates',
    version: '0.1.0',
    capabilities: ['templates', 'cms_access'],
    icon: '🏠',
    import: () => import('./real-estate-app/index.js'),
  },
  {
    id: 'logistics-app',
    name: 'Logistics App',
    description: 'Logistics presets: shipments schema + templates',
    version: '0.1.0',
    capabilities: ['templates', 'cms_access'],
    icon: '📦',
    import: () => import('./logistics-app/index.js'),
  },
];

