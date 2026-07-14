/**
 * Auto JSON-LD for blog posts from form/post data (+ optional custom override).
 */

function str(v) {
  return String(v || '').trim();
}

/**
 * @param {object} form
 * @returns {object | object[] | null}
 */
export function buildAutoBlogSchemaJsonLd(form) {
  const enableArticle = form?.enableArticleSchema !== false;
  const enableFaq = Boolean(form?.enableFaqSchema);
  const title = str(form?.seoTitle || form?.title);
  const description = str(form?.seoDescription || form?.excerpt);
  const image = str(form?.socialImage || form?.ogImage || form?.featuredImage);
  const url = str(form?.canonicalUrl) || (form?.slug ? `/blog/${form.slug}` : '');
  const authorName = str(form?.authorName) || 'Author';

  const parts = [];

  if (enableArticle) {
    parts.push({
      '@type': 'BlogPosting',
      headline: title,
      description,
      ...(url ? { mainEntityOfPage: url, url } : {}),
      ...(image ? { image } : {}),
      author: { '@type': 'Person', name: authorName },
      publisher: { '@type': 'Organization', name: authorName },
    });
  }

  if (enableFaq) {
    const faqs = (Array.isArray(form?.faqs) ? form.faqs : [])
      .filter((f) => str(f?.question) && str(f?.answer))
      .map((f) => ({
        '@type': 'Question',
        name: str(f.question),
        acceptedAnswer: { '@type': 'Answer', text: str(f.answer) },
      }));
    if (faqs.length) {
      parts.push({
        '@type': 'FAQPage',
        ...(url ? { url } : {}),
        mainEntity: faqs,
      });
    }
  }

  if (!parts.length) return null;
  if (parts.length === 1) {
    return { '@context': 'https://schema.org', ...parts[0] };
  }
  return { '@context': 'https://schema.org', '@graph': parts };
}
