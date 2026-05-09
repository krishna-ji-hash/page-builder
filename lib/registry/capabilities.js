export const CAPABILITIES = /** @type {const} */ ([
  'cms_access',
  'media_access',
  'runtime_actions',
  'form_hooks',
  'dynamic_routes',
  'templates',
  'widgets',
  'inspector_panels',
]);

export function isCapability(cap) {
  return CAPABILITIES.includes(String(cap || ''));
}

