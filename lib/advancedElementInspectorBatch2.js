/** Inspector form + patch helpers for advanced elements batch 2. */
import { brandLogoFormFields, brandLogoPropsPatchFromFormKey } from '@/lib/headerLogo';

export function advancedElementFormFromPropsBatch2(props = {}) {
  return {
    containerTitle: props.title ?? '',
    containerBody: props.body ?? '',
    containerAlign: props.align ?? 'left',
    gridColumns: Number(props.columns) > 0 ? Number(props.columns) : 3,
    gridGapPx: Number(props.gapPx) > 0 ? Number(props.gapPx) : 16,
    gridMobileStack: props.mobileStack !== false,
    gridItemsJson: JSON.stringify(Array.isArray(props.items) ? props.items : [], null, 2),
    alertVariant: props.variant ?? 'info',
    alertTitle: props.title ?? '',
    alertMessage: props.message ?? '',
    alertShowClose: props.showClose !== false,
    badgeText: props.text ?? '',
    badgeVariant: props.variant ?? 'primary',
    badgeSize: props.size ?? 'md',
    badgeHref: props.href ?? '',
    counterValue: props.value ?? '',
    counterPrefix: props.prefix ?? '',
    counterSuffix: props.suffix ?? '',
    counterLabel: props.label ?? '',
    counterDescription: props.description ?? '',
    progressLabel: props.label ?? '',
    progressPercentage: Number(props.percentage) >= 0 ? Number(props.percentage) : 0,
    progressHelper: props.helperText ?? '',
    ratingValue: Number(props.rating) >= 0 ? Number(props.rating) : 5,
    ratingMaxStars: Number(props.maxStars) > 0 ? Number(props.maxStars) : 5,
    ratingReviewText: props.reviewText ?? '',
    testimonialName: props.name ?? '',
    testimonialRole: props.role ?? '',
    testimonialMessage: props.message ?? '',
    testimonialAvatar: props.avatarSrc ?? '',
    testimonialRating: Number(props.rating) >= 0 ? Number(props.rating) : 5,
    pricingPlanName: props.planName ?? '',
    pricingPrice: props.price ?? '',
    pricingPeriod: props.period ?? '',
    pricingDescription: props.description ?? '',
    pricingFeatures: props.features ?? '',
    pricingCtaText: props.ctaText ?? '',
    pricingCtaHref: props.ctaHref ?? '#',
    pricingPopular: Boolean(props.popular),
    newsletterHeading: props.heading ?? '',
    newsletterText: props.text ?? '',
    newsletterPlaceholder: props.emailPlaceholder ?? '',
    newsletterButton: props.buttonText ?? '',
    whatsappPhone: props.phone ?? '',
    whatsappMessage: props.message ?? '',
    whatsappButtonText: props.buttonText ?? '',
    whatsappFloating: Boolean(props.floating),
    countdownTargetIso: props.targetIso ?? '',
    countdownLabel: props.label ?? '',
    htmlBlockContent: props.html ?? '',
    codeLanguage: props.language ?? 'javascript',
    codeContent: props.code ?? '',
    lottieJsonUrl: props.jsonUrl ?? '',
    lottieWidthPx: Number(props.widthPx) > 0 ? Number(props.widthPx) : 240,
    lottieHeightPx: Number(props.heightPx) > 0 ? Number(props.heightPx) : 240,
    lottieAlt: props.alt ?? 'Animation',
    logoSrc: props.src ?? '',
    ...brandLogoFormFields(props),
    logoHref: props.href ?? props.logoLink ?? '',
    logoWidthPx: Number(props.widthPx) > 0 ? Number(props.widthPx) : 160,
    featureListDirection: props.direction ?? 'vertical',
    featureListJson: JSON.stringify(Array.isArray(props.items) ? props.items : [], null, 2),
    tableProHeadersJson: JSON.stringify(Array.isArray(props.headers) ? props.headers : [], null, 2),
    tableProRowsJson: JSON.stringify(Array.isArray(props.rows) ? props.rows : [], null, 2),
    tableProHighlightColumn: Number(props.highlightColumn) || 0,
  };
}

/** formKey → { prop, jsonField } for JSON textarea saves */
export const ADVANCED_JSON_FIELD_MAP = {
  social_icons: { formKey: 'socialIconsJson', prop: 'links', array: true },
  grid_block: { formKey: 'gridItemsJson', prop: 'items', array: true },
  feature_list: { formKey: 'featureListJson', prop: 'items', array: true },
  table_pro: { formKey: 'tableProRowsJson', prop: 'rows', array: true, extraHeadersKey: 'tableProHeadersJson' },
};

export function advancedElementPatchFromFormKeyBatch2(nodeType, key, value) {
  switch (nodeType) {
    case 'container_box':
      if (key === 'containerTitle') return { patch: { title: value } };
      if (key === 'containerBody') return { patch: { body: value } };
      if (key === 'containerAlign') return { patch: { align: value } };
      break;
    case 'grid_block':
      if (key === 'gridColumns') return { patch: { columns: Math.max(1, Math.min(6, Number(value) || 3)) } };
      if (key === 'gridGapPx') return { patch: { gapPx: Math.max(0, Math.min(48, Number(value) || 16)) } };
      if (key === 'gridMobileStack') return { patch: { mobileStack: Boolean(value) } };
      break;
    case 'alert_notice':
      if (key === 'alertVariant') return { patch: { variant: value } };
      if (key === 'alertTitle') return { patch: { title: value } };
      if (key === 'alertMessage') return { patch: { message: value } };
      if (key === 'alertShowClose') return { patch: { showClose: Boolean(value) } };
      break;
    case 'badge_label':
      if (key === 'badgeText') return { patch: { text: value } };
      if (key === 'badgeVariant') return { patch: { variant: value } };
      if (key === 'badgeSize') return { patch: { size: value } };
      if (key === 'badgeHref') return { patch: { href: value } };
      break;
    case 'counter_block':
      if (key === 'counterValue') return { patch: { value: value } };
      if (key === 'counterPrefix') return { patch: { prefix: value } };
      if (key === 'counterSuffix') return { patch: { suffix: value } };
      if (key === 'counterLabel') return { patch: { label: value } };
      if (key === 'counterDescription') return { patch: { description: value } };
      break;
    case 'progress_bar':
      if (key === 'progressLabel') return { patch: { label: value } };
      if (key === 'progressPercentage') return { patch: { percentage: Math.max(0, Math.min(100, Number(value) || 0)) } };
      if (key === 'progressHelper') return { patch: { helperText: value } };
      break;
    case 'rating_stars':
      if (key === 'ratingValue') return { patch: { rating: Number(value) || 0 } };
      if (key === 'ratingMaxStars') return { patch: { maxStars: Math.max(1, Math.min(10, Number(value) || 5)) } };
      if (key === 'ratingReviewText') return { patch: { reviewText: value } };
      break;
    case 'testimonial_card':
      if (key === 'testimonialName') return { patch: { name: value } };
      if (key === 'testimonialRole') return { patch: { role: value } };
      if (key === 'testimonialMessage') return { patch: { message: value } };
      if (key === 'testimonialAvatar') return { patch: { avatarSrc: value } };
      if (key === 'testimonialRating') return { patch: { rating: Math.max(0, Math.min(5, Number(value) || 0)) } };
      break;
    case 'pricing_card':
      if (key === 'pricingPlanName') return { patch: { planName: value } };
      if (key === 'pricingPrice') return { patch: { price: value } };
      if (key === 'pricingPeriod') return { patch: { period: value } };
      if (key === 'pricingDescription') return { patch: { description: value } };
      if (key === 'pricingFeatures') return { patch: { features: value } };
      if (key === 'pricingCtaText') return { patch: { ctaText: value } };
      if (key === 'pricingCtaHref') return { patch: { ctaHref: value } };
      if (key === 'pricingPopular') return { patch: { popular: Boolean(value) } };
      break;
    case 'newsletter_form':
      if (key === 'newsletterHeading') return { patch: { heading: value } };
      if (key === 'newsletterText') return { patch: { text: value } };
      if (key === 'newsletterPlaceholder') return { patch: { emailPlaceholder: value } };
      if (key === 'newsletterButton') return { patch: { buttonText: value } };
      break;
    case 'whatsapp_button':
      if (key === 'whatsappPhone') return { patch: { phone: value } };
      if (key === 'whatsappMessage') return { patch: { message: value } };
      if (key === 'whatsappButtonText') return { patch: { buttonText: value } };
      if (key === 'whatsappFloating') return { patch: { floating: Boolean(value) } };
      break;
    case 'countdown_timer':
      if (key === 'countdownTargetIso') return { patch: { targetIso: value } };
      if (key === 'countdownLabel') return { patch: { label: value } };
      break;
    case 'html_block':
      if (key === 'htmlBlockContent') return { patch: { html: value } };
      break;
    case 'code_block':
      if (key === 'codeLanguage') return { patch: { language: value } };
      if (key === 'codeContent') return { patch: { code: value } };
      break;
    case 'lottie_animation':
      if (key === 'lottieJsonUrl') return { patch: { jsonUrl: value } };
      if (key === 'lottieWidthPx') return { patch: { widthPx: Math.max(80, Math.min(640, Number(value) || 240)) } };
      if (key === 'lottieHeightPx') return { patch: { heightPx: Math.max(80, Math.min(640, Number(value) || 240)) } };
      if (key === 'lottieAlt') return { patch: { alt: value } };
      break;
    case 'logo_block': {
      if (key === 'logoSrc') {
        const patch = brandLogoPropsPatchFromFormKey('lightLogoUrl', value, props);
        return patch ? { patch } : null;
      }
      if (key === 'logoHref') {
        const patch = brandLogoPropsPatchFromFormKey('logoLink', value, props);
        return patch ? { patch } : null;
      }
      if (key === 'logoAlt') {
        const patch = brandLogoPropsPatchFromFormKey('logoAlt', value, props);
        return patch ? { patch } : null;
      }
      if (key === 'logoWidthPx') {
        const patch = brandLogoPropsPatchFromFormKey('logoWidth', value, props);
        return patch ? { patch } : null;
      }
      const brandPatch = brandLogoPropsPatchFromFormKey(key, value, props);
      if (brandPatch) return { patch: brandPatch };
      break;
    }
    case 'feature_list':
      if (key === 'featureListDirection') return { patch: { direction: value } };
      break;
    case 'table_pro':
      if (key === 'tableProHighlightColumn') return { patch: { highlightColumn: Number(value) || 0 } };
      break;
    default:
      break;
  }
  return null;
}
