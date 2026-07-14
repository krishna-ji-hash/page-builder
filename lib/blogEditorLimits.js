/** Blog Add/Edit field limits + publishing checklist. */

export const BLOG_EDITOR_LIMITS = Object.freeze({
  titleMaxChars: 180,
  metaDescriptionMinChars: 100,
  metaDescriptionMaxChars: 220,
  excerptMaxWords: 30,
  contentMinWords: 300,
  contentMaxWords: 2500,
  faqMin: 2,
  faqMax: 10,
  focusKeywordsMaxWords: 10,
  metaKeywordsMaxWords: 5,
});

export function countWords(text) {
  const raw = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  if (!raw) return 0;
  return raw.split(/\s+/).filter(Boolean).length;
}

export function countChars(text) {
  return String(text || '').length;
}

export function contentWordCount(form) {
  const blocks = Array.isArray(form?.contentJson) ? form.contentJson : [];
  const fromBlocks = blocks.map((b) => `${b?.heading || ''} ${b?.text || ''}`).join(' ');
  const html = String(form?.contentHtml || '');
  return countWords(`${fromBlocks} ${html}`);
}

export function filledFaqCount(faqs) {
  return (Array.isArray(faqs) ? faqs : []).filter((f) => String(f?.question || '').trim() && String(f?.answer || '').trim())
    .length;
}

export function filledLinkCount(links) {
  return (Array.isArray(links) ? links : []).filter((l) => String(l?.url || '').trim()).length;
}

export function clampWords(text, maxWords) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(text || '').trim();
  return words.slice(0, maxWords).join(' ');
}

/**
 * Live checklist for the right rail.
 * @returns {{ id: string, label: string, ok: boolean }[]}
 */
export function buildBlogEditorChecklist(form) {
  const titleOk = Boolean(String(form?.title || '').trim());
  const slugOk = Boolean(String(form?.slug || '').trim());
  const excerptOk = countWords(form?.excerpt) > 0 && countWords(form?.excerpt) <= BLOG_EDITOR_LIMITS.excerptMaxWords;
  const imageOk = Boolean(String(form?.featuredImage || '').trim());
  const altOk = Boolean(String(form?.featuredImageAlt || '').trim());
  const categoryOk = Boolean(String(form?.categoryId || '').trim());
  const tagsOk = Array.isArray(form?.tagNames) && form.tagNames.length > 0;
  const seoTitleOk = Boolean(String(form?.seoTitle || form?.title || '').trim());
  const metaDescLen = countChars(form?.seoDescription);
  const metaDescOk =
    metaDescLen >= BLOG_EDITOR_LIMITS.metaDescriptionMinChars &&
    metaDescLen <= BLOG_EDITOR_LIMITS.metaDescriptionMaxChars;
  const faqCount = filledFaqCount(form?.faqs);
  const faqsOk = faqCount >= BLOG_EDITOR_LIMITS.faqMin && faqCount <= BLOG_EDITOR_LIMITS.faqMax;
  const schemaOk = Boolean(form?.enableArticleSchema || form?.enableFaqSchema || form?.schemaType === 'custom');
  const internalOk = filledLinkCount(form?.internalLinks) > 0;
  const previewOk = Boolean(form?.previewChecked);
  const words = contentWordCount(form);
  const contentOk = words >= BLOG_EDITOR_LIMITS.contentMinWords && words <= BLOG_EDITOR_LIMITS.contentMaxWords;
  const titleLenOk = countChars(form?.title) > 0 && countChars(form?.title) <= BLOG_EDITOR_LIMITS.titleMaxChars;

  const items = [
    { id: 'title', label: 'Title added', ok: titleOk && titleLenOk },
    { id: 'slug', label: 'Slug added', ok: slugOk },
    { id: 'excerpt', label: 'Excerpt added', ok: excerptOk },
    { id: 'content', label: `Content ${BLOG_EDITOR_LIMITS.contentMinWords}–${BLOG_EDITOR_LIMITS.contentMaxWords} words`, ok: contentOk },
    { id: 'featuredImage', label: 'Featured image added', ok: imageOk },
    { id: 'imageAlt', label: 'Image alt text added', ok: altOk },
    { id: 'category', label: 'Category selected', ok: categoryOk },
    { id: 'tags', label: 'Tags added', ok: tagsOk },
    { id: 'seoTitle', label: 'SEO title added', ok: seoTitleOk },
    { id: 'metaDescription', label: 'Meta description added', ok: metaDescOk },
    { id: 'faqs', label: 'FAQs added (2–10)', ok: faqsOk },
    { id: 'schema', label: 'Schema enabled', ok: schemaOk },
    { id: 'internalLinks', label: 'Internal links added', ok: internalOk },
    { id: 'preview', label: 'Preview checked', ok: previewOk },
  ];

  const ready = items.every((i) => i.ok);
  items.push({ id: 'ready', label: 'Ready to publish', ok: ready });
  return items;
}

/**
 * Soft warnings for form fields (non-blocking for draft).
 */
export function blogEditorFieldHints(form) {
  const hints = {};
  const titleLen = countChars(form?.title);
  if (titleLen > BLOG_EDITOR_LIMITS.titleMaxChars) {
    hints.title = `Max ${BLOG_EDITOR_LIMITS.titleMaxChars} characters`;
  }
  const excerptWords = countWords(form?.excerpt);
  if (excerptWords > BLOG_EDITOR_LIMITS.excerptMaxWords) {
    hints.excerpt = `Max ${BLOG_EDITOR_LIMITS.excerptMaxWords} words`;
  }
  const words = contentWordCount(form);
  if (words > 0 && (words < BLOG_EDITOR_LIMITS.contentMinWords || words > BLOG_EDITOR_LIMITS.contentMaxWords)) {
    hints.content = `${words} words (need ${BLOG_EDITOR_LIMITS.contentMinWords}–${BLOG_EDITOR_LIMITS.contentMaxWords})`;
  }
  const metaLen = countChars(form?.seoDescription);
  if (metaLen > 0 && (metaLen < BLOG_EDITOR_LIMITS.metaDescriptionMinChars || metaLen > BLOG_EDITOR_LIMITS.metaDescriptionMaxChars)) {
    hints.seoDescription = `${metaLen} chars (need ${BLOG_EDITOR_LIMITS.metaDescriptionMinChars}–${BLOG_EDITOR_LIMITS.metaDescriptionMaxChars})`;
  }
  const focusWords = countWords(form?.focusKeywords);
  if (focusWords > BLOG_EDITOR_LIMITS.focusKeywordsMaxWords) {
    hints.focusKeywords = `Max ${BLOG_EDITOR_LIMITS.focusKeywordsMaxWords} words`;
  }
  const metaKw = countWords(form?.metaKeywords);
  if (metaKw > BLOG_EDITOR_LIMITS.metaKeywordsMaxWords) {
    hints.metaKeywords = `Max ${BLOG_EDITOR_LIMITS.metaKeywordsMaxWords} words`;
  }
  const faqCount = filledFaqCount(form?.faqs);
  if (faqCount > 0 && (faqCount < BLOG_EDITOR_LIMITS.faqMin || faqCount > BLOG_EDITOR_LIMITS.faqMax)) {
    hints.faqs = `FAQs should be ${BLOG_EDITOR_LIMITS.faqMin}–${BLOG_EDITOR_LIMITS.faqMax}`;
  }
  return hints;
}
