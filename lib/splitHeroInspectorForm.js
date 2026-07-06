/** Form + pending-draft field values for Split Hero carousel inspector. */

export function splitHeroFormFieldsFromProps(props, pickPending) {
  const p = props && typeof props === 'object' ? props : {};
  const pick = (key, val) => (typeof pickPending === 'function' ? pickPending(key, val) : val);
  const maxRaw = p.splitHeroSectionMaxHeightPx;
  const maxStr =
    maxRaw === '' || maxRaw == null || maxRaw === undefined
      ? ''
      : String(Math.max(0, Math.round(Number(maxRaw) || 0)));

  return {
    splitHeroVisualWidthPct: pick('splitHeroVisualWidthPct', String(Number(p.splitHeroVisualWidthPct) || 40)),
    splitHeroVisualMinHeightPx: pick('splitHeroVisualMinHeightPx', String(Number(p.splitHeroVisualMinHeightPx) || 0)),
    splitHeroVisualOffsetXPx: pick('splitHeroVisualOffsetXPx', String(Number(p.splitHeroVisualOffsetXPx) || 0)),
    splitHeroVisualOffsetYPx: pick('splitHeroVisualOffsetYPx', String(Number(p.splitHeroVisualOffsetYPx) || 0)),
    splitHeroNavOffsetXPx: pick('splitHeroNavOffsetXPx', String(Number(p.splitHeroNavOffsetXPx) || 0)),
    splitHeroNavOffsetYPx: pick('splitHeroNavOffsetYPx', String(Number(p.splitHeroNavOffsetYPx) || 0)),
    splitHeroImageMaxHeightPx: pick('splitHeroImageMaxHeightPx', String(Number(p.splitHeroImageMaxHeightPx ?? 300))),
    splitHeroImageScalePct: pick('splitHeroImageScalePct', String(Number(p.splitHeroImageScalePct) || 100)),
    splitHeroSectionMinHeightPx: pick('splitHeroSectionMinHeightPx', String(Number(p.splitHeroSectionMinHeightPx) || 0)),
    splitHeroSectionMaxHeightPx: pick('splitHeroSectionMaxHeightPx', maxStr),
    sectionHeightPx: pick('sectionHeightPx', String(Number(p.sectionHeightPx) || 560)),
  };
}

export const INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS = new Set([
  'carouselEnsureSlide0Image',
  'carouselSlidePatch',
  'splitHeroVisualLayoutPatch',
  'splitHeroCtaStylePreset',
  'carouselSlidesReorder',
  'carouselAddSlide',
  'carouselRemoveSlide',
  'carouselSlidesJson',
  'featureTabsPatch',
  'faqAccordionPatch',
  'faqAccordionAddItem',
  'faqAccordionRemoveItem',
  'brandLogoMediaPick',
  'imageQuickPreset',
]);

export function shouldTrackPendingInspectorForm(key) {
  if (typeof key !== 'string') return false;
  if (INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS.has(key)) return false;
  if (
    key === 'carouselImageFit' ||
    key === 'splitHeroVisualFrame' ||
    key === 'splitHeroVisualShadow' ||
    key === 'splitHeroVisualBorder' ||
    key === 'splitHeroVisualBgColor' ||
    key === 'splitHeroVisualBorderColor' ||
    key === 'splitHeroImageScalePct' ||
    key === 'splitHeroBodyFontSizePx' ||
    key === 'splitHeroBodyColor' ||
    key === 'splitHeroCtaBackgroundColor' ||
    key === 'splitHeroCtaTextColor' ||
    key === 'splitHeroCtaBorderColor' ||
    key === 'splitHeroCtaFontSizePx' ||
    key === 'splitHeroCtaBorderRadiusPx' ||
    key === 'splitHeroCtaBorderWidthPx' ||
    key === 'sectionHeightPx'
  )
    return true;
  if (key.startsWith('splitHero')) return true;
  if (['fontSizePx', 'fontWeight', 'lineHeight', 'letterSpacingPx', 'textColor', 'fontFamily', 'alignment'].includes(key))
    return true;
  if (key.startsWith('carousel') && key !== 'carouselEnsureSlide0Image') return true;
  if (key === 'codeContent') return true;
  return false;
}

export function recordPendingInspectorForm(ref, key, value) {
  if (!shouldTrackPendingInspectorForm(key)) return;
  const pending = ref?.current && typeof ref.current === 'object' ? ref.current : {};
  ref.current = { ...pending, [key]: { value, ts: Date.now() } };
}
