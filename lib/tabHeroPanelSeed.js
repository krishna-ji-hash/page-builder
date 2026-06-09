/** Lightweight tab hero seed data — safe for widgetRegistry (no HTML/sanitize imports). */

export const TAB_HERO_PANEL_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1472851291508-756d8eaf45bf?auto=format&fit=crop&w=1600&q=80',
];

export const DEFAULT_TAB_HERO_PANELS = [
  {
    id: 'b2c-logistics',
    label: 'B2C Logistics',
    eyebrow: 'Dispatch',
    heading: 'Real-time serviceability API, tracking to power your 10-minute delivery promises',
    paragraph:
      'Dispatch powers our quick commerce operations with same-day delivery and real-time serviceability API for fast fulfillment.',
    ctaLabel: 'Deliver quickly',
    ctaHref: '#',
    imageSrc: TAB_HERO_PANEL_IMAGES[0],
    imageAlt: 'Warehouse logistics and parcel operations',
  },
  {
    id: 'b2b-retail',
    label: 'B2B Retail Operations',
    eyebrow: 'Dispatch',
    heading: 'Unified retail fulfillment for high-volume B2B order flows',
    paragraph:
      'Standardize pickups, bulk manifests, and lane-level SLAs across stores and distribution centers from one operations dashboard.',
    ctaLabel: 'Explore B2B',
    ctaHref: '#',
    imageSrc: TAB_HERO_PANEL_IMAGES[1],
    imageAlt: 'Retail store operations and inventory',
  },
  {
    id: 'e-commerce',
    label: 'E-Commerce',
    eyebrow: 'Dispatch',
    heading: 'Checkout-to-doorstep experiences buyers expect from modern brands',
    paragraph:
      'Plug serviceability, tracking, and returns into your storefront with APIs built for fast-growing D2C and marketplace sellers.',
    ctaLabel: 'Start selling',
    ctaHref: '#',
    imageSrc: TAB_HERO_PANEL_IMAGES[2],
    imageAlt: 'E-commerce shopping and online orders',
  },
];
