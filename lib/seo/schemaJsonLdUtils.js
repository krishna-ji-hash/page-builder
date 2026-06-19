function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Fill missing schema.org url/description/image fields after template binding.
 */
export function enrichSchemaJsonLd(schema, { title = '', description = '', url = '', image = '' } = {}) {
  if (!isPlainObject(schema)) return schema;
  const out = { ...schema };
  const type = str(out['@type']);

  if (!str(out.description) && description) out.description = description;
  if (!str(out.url) && url) out.url = url;

  if ((type === 'Article' || type === 'BlogPosting') && !str(out.headline) && title) {
    out.headline = title;
  }
  if (!str(out.name) && title && type !== 'Article' && type !== 'BlogPosting') {
    out.name = title;
  }
  if (!out.image && image) out.image = image;
  if (type === 'Article' || type === 'BlogPosting') {
    if (!str(out.mainEntityOfPage) && url) out.mainEntityOfPage = url;
  }
  if (type === 'WebPage' && isPlainObject(out.isPartOf) && !str(out.isPartOf.url) && url) {
    out.isPartOf = { ...out.isPartOf, url };
  }

  return out;
}
