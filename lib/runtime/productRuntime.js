/**
 * Product Detail Page (PDP) runtime — normalize CMS product + variants, pricing, stock, gallery.
 * Used by PDP blocks, SEO helpers, and ecommerce API mapping.
 */

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStr(v) {
  return v == null ? '' : String(v);
}

function toBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return Boolean(v);
}

function asStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

/** @typedef {{ sku: string, title: string, options: Record<string, string>, price: number, salePrice: number, effectivePrice: number, stock: number, image: string, gallery: string[] }} NormalizedVariant */

/**
 * @param {unknown} raw
 * @param {{ baseSku?: string, basePrice?: number, baseSalePrice?: number, baseStock?: number, baseImage?: string, baseGallery?: string[] }} [base]
 * @returns {NormalizedVariant|null}
 */
export function normalizeVariant(raw, base = {}) {
  if (!isPlainObject(raw)) return null;
  const sku = toStr(raw.sku || raw.id).trim();
  if (!sku) return null;
  const price = toNum(raw.price, base.basePrice ?? 0);
  const salePrice = toNum(raw.salePrice, 0);
  const effectivePrice = salePrice > 0 ? salePrice : price > 0 ? price : base.basePrice ?? 0;
  const options = isPlainObject(raw.options) ? raw.options : {};
  const normalizedOptions = {};
  for (const [k, v] of Object.entries(options)) {
    normalizedOptions[toStr(k)] = toStr(v).trim();
  }
  const image = toStr(raw.image || raw.imageSrc).trim() || base.baseImage || '';
  const gallery = Array.isArray(raw.gallery)
    ? raw.gallery.map((x) => toStr(x).trim()).filter(Boolean)
    : asStringArray(raw.gallery);
  return {
    sku,
    title: toStr(raw.title || raw.label || sku).trim() || sku,
    options: normalizedOptions,
    price,
    salePrice,
    effectivePrice,
    stock: Math.max(0, Math.floor(toNum(raw.stock, base.baseStock ?? 0))),
    image: image || base.baseImage || '',
    gallery: gallery.length ? gallery : base.baseGallery || (image ? [image] : []),
  };
}

/**
 * @param {import('./ecommerceCmsData.js').mapProduct extends Function ? never : any} mappedOrCmsItem
 * @returns {import('./productRuntime.js').NormalizedProduct}
 */
export function normalizeProductFromMapped(mapped) {
  const m = isPlainObject(mapped) ? mapped : {};
  const basePrice = toNum(m.price, 0);
  const baseSale = toNum(m.salePrice, 0);
  const baseEffective = toNum(m.effectivePrice, baseSale > 0 ? baseSale : basePrice);
  const baseImage = toStr(m.image).trim();
  const baseGallery = Array.isArray(m.gallery) ? m.gallery.map((x) => toStr(x).trim()).filter(Boolean) : [];
  const gallery =
    baseGallery.length > 0 ? baseGallery : baseImage ? [baseImage] : [];
  const base = {
    baseSku: toStr(m.sku).trim(),
    basePrice,
    baseSalePrice: baseSale,
    baseStock: Math.max(0, Math.floor(toNum(m.stock, 0))),
    baseImage,
    baseGallery: gallery,
  };
  const rawVariants = Array.isArray(m.variants) ? m.variants : [];
  const variants = rawVariants
    .map((v) => normalizeVariant(v, base))
    .filter(Boolean);
  const variantOptionKeys = collectVariantOptionKeys(variants);
  return {
    id: m.id ?? null,
    title: toStr(m.title).trim(),
    slug: toStr(m.slug).trim(),
    sku: base.baseSku,
    category: toStr(m.category).trim(),
    description: toStr(m.description).trim(),
    tags: asStringArray(m.tags),
    featured: toBool(m.featured),
    currency: toStr(m.currency || 'INR').trim() || 'INR',
    price: basePrice,
    salePrice: baseSale,
    effectivePrice: baseEffective,
    stock: base.baseStock,
    image: baseImage,
    gallery,
    variants,
    variantOptionKeys,
    specifications: normalizeSpecifications(m.specifications || m.specs),
    deliveryEtaDays: Math.max(0, Math.floor(toNum(m.deliveryEtaDays ?? m.deliveryDays, 0))),
  };
}

/**
 * CMS item shape from getItemBySlug.
 * @param {{ id?: number, title?: string, slug?: string, data?: object }} item
 */
export function normalizeProductFromCmsItem(item) {
  const data = isPlainObject(item?.data) ? item.data : {};
  return normalizeProductFromMapped({
    id: item?.id ?? null,
    title: item?.title || data.title,
    slug: item?.slug || data.slug,
    sku: data.sku,
    category: data.category,
    featured: data.featured,
    price: data.price,
    salePrice: data.salePrice,
    currency: data.currency,
    stock: data.stock,
    image: data.image,
    gallery: data.gallery,
    description: data.description,
    tags: data.tags,
    variants: data.variants,
    specifications: data.specifications || data.specs,
    deliveryEtaDays: data.deliveryEtaDays ?? data.deliveryDays,
  });
}

function normalizeSpecifications(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((row) => {
        if (!isPlainObject(row)) return null;
        const label = toStr(row.label || row.name).trim();
        const value = toStr(row.value).trim();
        if (!label) return null;
        return { label, value };
      })
      .filter(Boolean);
  }
  if (isPlainObject(raw)) {
    return Object.entries(raw).map(([label, value]) => ({
      label: toStr(label).trim(),
      value: toStr(value).trim(),
    }));
  }
  return [];
}

function collectVariantOptionKeys(variants) {
  const keys = new Set();
  for (const v of variants) {
    for (const k of Object.keys(v.options || {})) keys.add(k);
  }
  return [...keys];
}

/**
 * @param {NormalizedProduct} product
 * @param {NormalizedVariant|null} variant
 */
export function resolveProductPricing(product, variant) {
  const price = variant?.price ?? product.price;
  const salePrice = variant?.salePrice ?? product.salePrice;
  const effectivePrice =
    variant?.effectivePrice ?? (salePrice > 0 ? salePrice : product.effectivePrice);
  const onSale = salePrice > 0 && salePrice < price;
  return {
    price,
    salePrice,
    effectivePrice,
    onSale,
    currency: product.currency,
    compareAt: onSale ? price : null,
  };
}

export function resolveProductStock(product, variant) {
  if (variant) return Math.max(0, Math.floor(variant.stock));
  return Math.max(0, Math.floor(product.stock));
}

export function resolveProductGallery(product, variant) {
  const fromVariant = variant?.gallery?.length ? variant.gallery : variant?.image ? [variant.image] : [];
  if (fromVariant.length) return fromVariant;
  if (product.gallery?.length) return product.gallery;
  return product.image ? [product.image] : [];
}

export function resolveActiveSku(product, variant) {
  return variant?.sku || product.sku || '';
}

export function findVariantByOptions(product, selectedOptions) {
  if (!product?.variants?.length || !selectedOptions) return null;
  const sel = selectedOptions;
  return (
    product.variants.find((v) => {
      const opts = v.options || {};
      return Object.keys(sel).every((k) => toStr(opts[k]) === toStr(sel[k]));
    }) || null
  );
}

export function findVariantBySku(product, sku) {
  const s = toStr(sku).trim();
  if (!s || !product?.variants?.length) return null;
  return product.variants.find((v) => v.sku === s) || null;
}

export function defaultSelectedOptions(product, variant) {
  if (variant?.options) return { ...variant.options };
  const first = product?.variants?.[0];
  return first?.options ? { ...first.options } : {};
}

export function variantOptionValues(product, optionKey) {
  const key = toStr(optionKey).trim();
  if (!key) return [];
  const values = new Set();
  for (const v of product?.variants || []) {
    const val = toStr(v.options?.[key]).trim();
    if (val) values.add(val);
  }
  return [...values];
}

export function computeReviewStats(reviews) {
  const rows = Array.isArray(reviews) ? reviews : [];
  if (!rows.length) return { average: 0, count: 0 };
  const sum = rows.reduce((acc, r) => acc + Math.max(1, Math.min(5, Math.round(toNum(r.rating, 5)))), 0);
  return { average: Math.round((sum / rows.length) * 10) / 10, count: rows.length };
}

export function buildRelatedProductsQuery(product, props = {}) {
  const limit = Math.min(24, Math.max(1, Math.floor(toNum(props.limit, 4))));
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', '0');
  if (product?.category && props.useCategory !== false) params.set('category', product.category);
  if (product?.featured && props.featuredOnly) params.set('featured', 'true');
  const tag = Array.isArray(product?.tags) ? product.tags[0] : '';
  if (tag && props.useTags) params.set('q', tag);
  if (props.sortBy) params.set('sortBy', toStr(props.sortBy));
  return params;
}

export function filterRelatedProducts(rows, product, excludeSlug) {
  const slug = toStr(excludeSlug || product?.slug).trim();
  const sku = toStr(product?.sku).trim();
  return (Array.isArray(rows) ? rows : []).filter((p) => {
    if (slug && p.slug === slug) return false;
    if (sku && p.sku === sku) return false;
    return true;
  });
}

/**
 * Rich Product schema for JSON-LD (schema.org/Product).
 * @param {{ product: object, pricing: object, stock: number, reviewStats: object, canonical?: string, projectSlug?: string }} params
 */
export function buildProductSchemaJsonLd({ product, pricing, stock, reviewStats, canonical, projectSlug }) {
  if (!product) return null;
  const availability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const images = resolveProductGallery(product, null);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    sku: product.sku || undefined,
    description: product.description || undefined,
    image: images.length ? images : undefined,
    offers: {
      '@type': 'Offer',
      price: pricing?.effectivePrice ?? product.effectivePrice,
      priceCurrency: product.currency || 'INR',
      availability,
      url: canonical || undefined,
    },
  };
  if (reviewStats?.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.average,
      reviewCount: reviewStats.count,
    };
  }
  if (product.category) schema.category = product.category;
  if (projectSlug && product.slug) {
    schema.url = canonical || `/${projectSlug}/product/${product.slug}`;
  }
  return schema;
}

export function buildBreadcrumbSchemaJsonLd({ projectSlug, product, categoryLabel }) {
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: projectSlug ? `/${projectSlug}` : '/' },
  ];
  if (categoryLabel) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: categoryLabel,
      item: projectSlug ? `/${projectSlug}?category=${encodeURIComponent(categoryLabel)}` : undefined,
    });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: product?.title || 'Product',
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}
