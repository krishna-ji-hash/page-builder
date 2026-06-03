/**
 * Widget definitions by project type. Layout nodes (row, column, stack) are always allowed
 * and validated separately via builderHierarchy.
 */

// Apps are loaded dynamically per project by the App Loader (Phase 13).
// Widget registry only reads already-registered contributions.
import { getRegisteredWidgets } from '../registry/appRegistry.js';
import { DEFAULT_FEATURE_TABS } from '../featureTabsDefaults.js';
import { DEFAULT_FAQ_ITEMS } from '../faqAccordionDefaults.js';
import { ADVANCED_WEBSITE_WIDGETS } from '../advancedElementRegistry.js';
import { PDP_WEBSITE_WIDGETS } from '../pdpElementRegistry.js';

const websiteWidgets = {
  heading: {
    type: 'heading',
    label: 'Heading',
    allowedParents: ['stack'],
    defaultProps: { text: 'New Heading' },
    supportsData: false,
    supportsActions: false,
  },
  text: {
    type: 'text',
    label: 'Text',
    allowedParents: ['stack'],
    defaultProps: { text: 'New paragraph' },
    supportsData: false,
    supportsActions: false,
  },
  paragraph: {
    type: 'paragraph',
    label: 'Paragraph',
    allowedParents: ['stack'],
    defaultProps: { text: 'Add your paragraph text here.', tag: 'p' },
    supportsData: false,
    supportsActions: false,
  },
  rich_text: {
    type: 'rich_text',
    label: 'Rich text',
    allowedParents: ['stack'],
    defaultProps: {
      content: '<p>Start typing. Double‑click to edit.</p>',
      animation: { preset: 'none', duration: 0.6, delay: 0 },
    },
    supportsData: false,
    supportsActions: false,
  },
  image: {
    type: 'image',
    label: 'Image',
    allowedParents: ['stack'],
    defaultProps: { src: '', alt: '' },
    supportsData: false,
    supportsActions: false,
  },
  button: {
    type: 'button',
    label: 'Button',
    allowedParents: ['stack'],
    defaultProps: { text: 'Click me' },
    defaultActions: {},
    supportsData: false,
    supportsActions: true,
  },
  divider: {
    type: 'divider',
    label: 'Line',
    allowedParents: ['stack'],
    defaultProps: { orientation: 'horizontal', thicknessPx: 2 },
    supportsData: false,
    supportsActions: false,
  },
  menu: {
    type: 'menu',
    label: 'Menu',
    allowedParents: ['stack'],
    defaultProps: {
      items: [
        { label: 'Home', to: '/' },
        { label: 'About', to: '/about' },
        { label: 'Contact', to: '/contact' },
      ],
      variant: 'pill',
      align: 'left',
    },
    supportsData: false,
    supportsActions: false,
  },
  carousel: {
    type: 'carousel',
    label: 'Carousel',
    allowedParents: ['stack'],
    defaultProps: {
      // Production slider schema (Elementor-like). Runtime keeps backward-compat with `settings.*`.
      variant: 'image', // image | hero | card | logo | ticker | marquee
      showOverlay: false,
      autoplay: true,
      loop: true,
      showArrows: true,
      showDots: true,
      speed: 500,
      interval: 3000,
      slidesPerView: { desktop: 1, tablet: 1, mobile: 1 },
      gap: 16,
      scrollDirection: 'right',
      // Backward-compatible settings payload (older builds / saved nodes).
      settings: {
        variant: 'image',
        showOverlay: false,
        autoplay: true,
        loop: true,
        arrows: true,
        dots: true,
        speedMs: 500,
        autoplayMs: 3000,
        gapPx: 16,
        perView: { desktop: 1, tablet: 1, mobile: 1 },
        scrollDirection: 'right',
      },
      slides: [
        {
          id: 'slide-1',
          title: 'Slide title',
          subtitle: 'Slide subtitle',
          image:
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
          buttonText: 'Learn More',
          buttonUrl: '#',
          // Extra fields supported by runtime (hero/card modes)
          imageAlt: 'Team working',
          body: 'Carousel content block 1',
          imageSrc:
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
          card: { title: 'Card title', body: 'Overlay card copy', align: 'left', theme: 'dark' },
          cta: { label: 'Learn more', href: '/about' },
        },
        {
          id: 'slide-2',
          title: 'Slide title',
          subtitle: 'Slide subtitle',
          image:
            'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80',
          buttonText: 'Learn More',
          buttonUrl: '#',
          imageAlt: 'Office discussion',
          body: 'Carousel content block 2',
          imageSrc:
            'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80',
          card: { title: 'Second card', body: 'More details', align: 'right', theme: 'light' },
        },
      ],
    },
    supportsData: false,
    supportsActions: false,
  },
  tabs: {
    type: 'tabs',
    label: 'Feature tabs',
    allowedParents: ['stack'],
    defaultProps: {
      activeTabId: DEFAULT_FEATURE_TABS[0]?.id || 'delivery-success',
      tabs: DEFAULT_FEATURE_TABS,
      imageFit: 'cover',
      imageHeightPx: 360,
      tabAlign: 'center',
    },
    supportsData: false,
    supportsActions: false,
  },
  accordion: {
    type: 'accordion',
    label: 'FAQ accordion',
    allowedParents: ['stack'],
    defaultProps: {
      openItemId: '',
      items: DEFAULT_FAQ_ITEMS,
    },
    supportsData: false,
    supportsActions: false,
  },
  form: {
    type: 'form',
    label: 'Form',
    allowedParents: ['stack'],
    defaultProps: {
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: false },
      ],
      submitLabel: 'Submit',
      layout: { labelGapPx: 8, inputAfterGapPx: 16, beforeSubmitGapPx: 20 },
      notifications: {
        webhookUrl: '',
        emailTo: '',
      },
      workflow: {
        onSubmit: [
          { type: 'save_lead', enabled: true },
          { type: 'success_message', enabled: true, message: 'Thank you — we received your message.' },
        ],
      },
      states: {
        success: { title: 'Thank you', message: 'We received your submission.' },
        error: { title: 'Something went wrong', message: 'Please try again.' },
      },
      analytics: { enabled: true },
      steps: [],
    },
    defaultDataSource: {
      kind: 'internal_api',
      resource: 'form_submissions',
      path: '/api/forms/submit',
      method: 'POST',
    },
    supportsData: true,
    supportsActions: true,
  },
  input: {
    type: 'input',
    label: 'Input',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'field',
      label: 'Field label',
      type: 'text', // text | email | phone | number | date
      placeholder: '',
      required: false,
      width: '100%', // 100% | 50% | 33.33% | 25% (builder-only hint; runtime can ignore for now)
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  textarea: {
    type: 'textarea',
    label: 'Textarea',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'message',
      label: 'Message',
      placeholder: '',
      required: false,
      rows: 4,
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  select: {
    type: 'select',
    label: 'Select',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'select',
      label: 'Select',
      placeholder: 'Select option',
      required: false,
      options: [
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
      ],
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'checkbox',
      label: 'I agree',
      required: false,
      checkedByDefault: false,
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  radio: {
    type: 'radio',
    label: 'Radio',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'radio',
      label: 'Choose one',
      required: false,
      options: [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ],
      defaultValue: '',
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'switch',
      label: 'Enable',
      required: false,
      onByDefault: false,
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  date: {
    type: 'date',
    label: 'Date picker',
    allowedParents: ['stack'],
    defaultProps: {
      name: 'date',
      label: 'Pick a date',
      required: false,
      placeholder: '',
      width: '100%',
      validation: {},
    },
    supportsData: false,
    supportsActions: false,
  },
  submit: {
    type: 'submit',
    label: 'Submit button',
    allowedParents: ['stack'],
    defaultProps: {
      text: 'Submit',
      variant: 'primary', // primary | secondary | ghost (builder can map to styling)
      width: 'auto',
    },
    supportsData: false,
    supportsActions: false,
  },
  ...ADVANCED_WEBSITE_WIDGETS,
  ...PDP_WEBSITE_WIDGETS,
};

const dashboardWidgets = {
  heading: { ...websiteWidgets.heading },
  text: { ...websiteWidgets.text },
  rich_text: { ...websiteWidgets.rich_text },
  image: { ...websiteWidgets.image },
  button: { ...websiteWidgets.button },
  menu: { ...websiteWidgets.menu },
  divider: { ...websiteWidgets.divider },
  carousel: { ...websiteWidgets.carousel },
  form: { ...websiteWidgets.form },
  input: { ...websiteWidgets.input },
  textarea: { ...websiteWidgets.textarea },
  select: { ...websiteWidgets.select },
  checkbox: { ...websiteWidgets.checkbox },
  radio: { ...websiteWidgets.radio },
  switch: { ...websiteWidgets.switch },
  date: { ...websiteWidgets.date },
  submit: { ...websiteWidgets.submit },
  table: {
    type: 'table',
    label: 'Table',
    allowedParents: ['stack'],
    defaultProps: {
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
      ],
    },
    defaultDataSource: {
      kind: 'internal_api',
      resource: 'users',
      path: '/api/runtime/data/users',
      method: 'GET',
    },
    supportsData: true,
    supportsActions: false,
  },
};

const adminWidgets = {
  heading: { ...websiteWidgets.heading },
  text: { ...websiteWidgets.text },
  rich_text: { ...websiteWidgets.rich_text },
  image: { ...websiteWidgets.image },
  button: { ...websiteWidgets.button },
  menu: { ...websiteWidgets.menu },
  divider: { ...websiteWidgets.divider },
  carousel: { ...websiteWidgets.carousel },
  input: { ...websiteWidgets.input },
  textarea: { ...websiteWidgets.textarea },
  select: { ...websiteWidgets.select },
  checkbox: { ...websiteWidgets.checkbox },
  radio: { ...websiteWidgets.radio },
  switch: { ...websiteWidgets.switch },
  date: { ...websiteWidgets.date },
  submit: { ...websiteWidgets.submit },
  table: { ...dashboardWidgets.table },
  form: { ...websiteWidgets.form },
};

/** @type {Record<string, Record<string, object>>} */
export const widgetRegistry = {
  website: websiteWidgets,
  dashboard: dashboardWidgets,
  admin: adminWidgets,
  app: {
    ...dashboardWidgets,
    image: { ...websiteWidgets.image },
  },
};

const DEFAULT_TYPE = 'website';

export function getWidgetsForProjectType(projectType) {
  const key = projectType && widgetRegistry[projectType] ? projectType : DEFAULT_TYPE;
  const base = widgetRegistry[key] || widgetRegistry[DEFAULT_TYPE];
  const ext = getRegisteredWidgets(key);
  // Additive: apps can only add/override allowed types in registry validation.
  return { ...(base || {}), ...(ext || {}) };
}

export function getWidgetDefinition(projectType, widgetType) {
  const widgets = getWidgetsForProjectType(projectType);
  return widgets[widgetType] || null;
}

export function isWidgetAllowed(projectType, widgetType) {
  if (!widgetType || typeof widgetType !== 'string') return false;
  return Boolean(getWidgetDefinition(projectType, widgetType));
}
