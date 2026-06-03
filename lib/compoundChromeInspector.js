import { compoundChromeKindForNodeType, COMPOUND_CHROME_KINDS } from './compoundWidgetRegistry.js';
import {
  featureTabsChromeInspectorFields,
  isFeatureTabsChromeKey,
  patchFeatureTabsChromeFromKey,
} from './featureTabsChrome.js';
import {
  carouselChromeInspectorFields,
  isCarouselChromeKey,
  patchCarouselChromeFromKey,
} from './carouselChrome.js';
import {
  faqAccordionChromeInspectorFields,
  isFaqAccordionChromeKey,
  patchFaqAccordionChromeFromKey,
} from './faqAccordionChrome.js';
import {
  cardChromeInspectorFields,
  isCardChromeKey,
  patchCardChromeFromKey,
  CARD_CHROME_NODE_TYPES,
} from './cardChrome.js';

export function compoundChromeFormFields(nodeType, props, pickPending) {
  const kind = compoundChromeKindForNodeType(nodeType);
  if (kind === COMPOUND_CHROME_KINDS.tabs) return featureTabsChromeInspectorFields(props, pickPending);
  if (kind === COMPOUND_CHROME_KINDS.carousel) return carouselChromeInspectorFields(props, pickPending);
  if (kind === COMPOUND_CHROME_KINDS.accordion) return faqAccordionChromeInspectorFields(props, pickPending);
  if (kind === COMPOUND_CHROME_KINDS.card && CARD_CHROME_NODE_TYPES.has(nodeType)) {
    return cardChromeInspectorFields(props, pickPending);
  }
  return {};
}

export function isCompoundChromeKey(key, nodeType) {
  const kind = compoundChromeKindForNodeType(nodeType);
  if (kind === COMPOUND_CHROME_KINDS.tabs) return isFeatureTabsChromeKey(key);
  if (kind === COMPOUND_CHROME_KINDS.carousel) return isCarouselChromeKey(key);
  if (kind === COMPOUND_CHROME_KINDS.accordion) return isFaqAccordionChromeKey(key);
  if (kind === COMPOUND_CHROME_KINDS.card) return isCardChromeKey(key);
  return false;
}

export function patchCompoundChromeFromKey(key, value, prevChrome, nodeType) {
  const kind = compoundChromeKindForNodeType(nodeType);
  if (kind === COMPOUND_CHROME_KINDS.tabs) return patchFeatureTabsChromeFromKey(key, value, prevChrome);
  if (kind === COMPOUND_CHROME_KINDS.carousel) return patchCarouselChromeFromKey(key, value, prevChrome);
  if (kind === COMPOUND_CHROME_KINDS.accordion) return patchFaqAccordionChromeFromKey(key, value, prevChrome);
  if (kind === COMPOUND_CHROME_KINDS.card) return patchCardChromeFromKey(key, value, prevChrome);
  return null;
}

export function compoundChromeResetFormFields(nodeType) {
  return compoundChromeFormFields(nodeType, {}, () => '');
}
