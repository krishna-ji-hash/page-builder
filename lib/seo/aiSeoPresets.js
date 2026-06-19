/** Dispatch / logistics industry keyword presets for AI SEO. */
export const DISPATCH_SEO_PRESETS = Object.freeze({
  logistics: {
    label: 'Logistics',
    focusKeywords: ['logistics software', 'logistics management', 'supply chain logistics'],
    secondary: ['freight', 'warehousing', 'distribution', '3PL'],
    longTail: ['best logistics software india', 'multi carrier logistics platform'],
  },
  courier: {
    label: 'Courier',
    focusKeywords: ['courier service', 'courier delivery', 'courier aggregator'],
    secondary: ['express delivery', 'last mile', 'pickup', 'delivery partner'],
    longTail: ['courier service for ecommerce', 'bulk courier booking platform'],
  },
  shipping: {
    label: 'Shipping',
    focusKeywords: ['shipping platform', 'multi carrier shipping', 'ecommerce shipping'],
    secondary: ['rate calculator', 'label printing', 'order fulfillment'],
    longTail: ['cheapest shipping rates india', 'shipping api for shopify'],
  },
  ndr: {
    label: 'NDR',
    focusKeywords: ['NDR management', 'non delivery report', 'failed delivery recovery'],
    secondary: ['reattempt', 'RTO', 'customer verification', 'delivery exceptions'],
    longTail: ['reduce RTO ecommerce', 'NDR automation courier'],
  },
  cod: {
    label: 'COD',
    focusKeywords: ['COD orders', 'cash on delivery', 'COD verification'],
    secondary: ['COD remittance', 'prepaid conversion', 'fake COD'],
    longTail: ['COD order verification system', 'reduce COD returns'],
  },
  tracking: {
    label: 'Tracking',
    focusKeywords: ['shipment tracking', 'order tracking', 'real time tracking'],
    secondary: ['tracking page', 'branded tracking', 'SMS updates'],
    longTail: ['custom branded tracking page', 'multi carrier tracking api'],
  },
  warehouse: {
    label: 'Warehouse',
    focusKeywords: ['warehouse management', 'inventory management', 'WMS'],
    secondary: ['pick pack ship', 'stock sync', 'fulfillment center'],
    longTail: ['warehouse management for ecommerce', 'inventory sync shopify'],
  },
  fulfillment: {
    label: 'Fulfillment',
    focusKeywords: ['order fulfillment', 'ecommerce fulfillment', '3PL fulfillment'],
    secondary: ['same day delivery', 'SLA', 'returns management'],
    longTail: ['fulfillment services india', 'omnichannel fulfillment platform'],
  },
});

export const DISPATCH_PRESET_IDS = Object.freeze(Object.keys(DISPATCH_SEO_PRESETS));

export function getDispatchPreset(presetId) {
  return DISPATCH_SEO_PRESETS[presetId] || null;
}

export function matchDispatchPresetFromContent(text) {
  const t = String(text || '').toLowerCase();
  for (const id of DISPATCH_PRESET_IDS) {
    if (t.includes(id)) return id;
  }
  if (/\b(3pl|supply chain)\b/.test(t)) return 'logistics';
  if (/\b(deliver|parcel)\b/.test(t)) return 'courier';
  return null;
}
