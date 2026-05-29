'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RuntimeLeafProvider } from './RuntimeLeafProvider';
import { useRuntimeData } from './RuntimeProvider';
import { useCart } from './CartProvider';
import { useProductRuntime } from '@/hooks/useProductRuntime';
import {
  buildRelatedProductsQuery,
  computeReviewStats,
  filterRelatedProducts,
  variantOptionValues,
} from '@/lib/runtime/productRuntime';

function cn(...parts) {
  return parts.filter(Boolean).join(' ').trim();
}

function currencyFmt(currency) {
  const c = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'INR';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 0 });
}

function requireRuntimeKey(runtimeKey) {
  const rk = typeof runtimeKey === 'string' ? runtimeKey.trim() : '';
  return rk || '';
}

function useProductState(runtimeKey, initialProduct) {
  const rk = requireRuntimeKey(runtimeKey);
  const { state, selectOptions, setQuantity, setGalleryIndex } = useProductRuntime(rk, initialProduct || null);
  return { rk, state, selectOptions, setQuantity, setGalleryIndex };
}

export function PdpGallery(props) {
  return (
    <RuntimeLeafProvider>
      <PdpGalleryInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpGalleryInner({
  runtimeKey,
  product,
  style,
  className,
  layout,
  thumbsPosition = 'left',
  showThumbs = true,
  alt,
}) {
  const { state, setGalleryIndex } = useProductState(runtimeKey, product);
  const gallery = state?.gallery || [];
  const idx = Math.max(0, Math.min(gallery.length - 1, Number(state?.activeImageIndex || 0)));
  const main = gallery[idx] || gallery[0] || '';
  const effectiveThumbsPos =
    layout === 'thumbnails-left' || layout === 'thumbs-left'
      ? 'left'
      : layout === 'thumbnails-top' || layout === 'thumbs-top'
        ? 'top'
        : thumbsPosition;
  const layoutClass = effectiveThumbsPos === 'left' ? 'pdp-gallery--thumbs-left' : '';

  if (!main) return <div className={cn('pdp-block', className)} style={style} />;

  return (
    <div className={cn('pdp-block pdp-gallery', layoutClass, className)} style={style}>
      {showThumbs ? (
        <div className="pdp-gallery__thumbs" aria-label="Product thumbnails">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={cn('pdp-gallery__thumb', i === idx ? 'is-active' : '')}
              onClick={() => setGalleryIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === idx ? 'true' : undefined}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="pdp-gallery__main">
        <img src={main} alt={alt || state?.product?.title || ''} />
      </div>
    </div>
  );
}

export function PdpImageZoom(props) {
  return (
    <RuntimeLeafProvider>
      <PdpImageZoomInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpImageZoomInner({ runtimeKey, product, style, className, alt }) {
  const { state } = useProductState(runtimeKey, product);
  const gallery = state?.gallery || [];
  const idx = Math.max(0, Math.min(gallery.length - 1, Number(state?.activeImageIndex || 0)));
  const src = gallery[idx] || gallery[0] || '';
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => setZoomed(false), [src]);

  if (!src) return <div className={cn('pdp-block', className)} style={style} />;

  return (
    <div
      className={cn('pdp-block pdp-zoom', zoomed ? 'is-zoomed' : '', className)}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => setZoomed((z) => !z)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setZoomed((z) => !z);
      }}
      aria-label={zoomed ? 'Zoom out image' : 'Zoom in image'}
    >
      <img src={src} alt={alt || state?.product?.title || ''} />
    </div>
  );
}

export function PdpVariantSelector(props) {
  return (
    <RuntimeLeafProvider>
      <PdpVariantSelectorInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpVariantSelectorInner({ runtimeKey, product, style, className, optionKeys }) {
  const { state, selectOptions } = useProductState(runtimeKey, product);
  const p = state?.product;
  const selected = state?.selectedOptions || {};

  const keys = useMemo(() => {
    if (Array.isArray(optionKeys) && optionKeys.length) return optionKeys.map(String).filter(Boolean);
    return Array.isArray(p?.variantOptionKeys) ? p.variantOptionKeys : [];
  }, [optionKeys, p?.variantOptionKeys]);

  if (!p || !keys.length) return <div className={cn('pdp-block', className)} style={style} />;

  return (
    <div className={cn('pdp-block', className)} style={style}>
      {keys.map((k) => {
        const values = variantOptionValues(p, k);
        if (!values.length) return null;
        const sel = selected[k] || '';
        return (
          <div key={k} className="pdp-variant__group">
            <span className="pdp-variant__label">{k}</span>
            <div className="pdp-variant__options" role="list">
              {values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={cn('pdp-variant__pill', v === sel ? 'is-selected' : '')}
                  onClick={() => selectOptions({ [k]: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PdpPrice(props) {
  return (
    <RuntimeLeafProvider>
      <PdpPriceInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpPriceInner({ runtimeKey, product, style, className }) {
  const { state } = useProductState(runtimeKey, product);
  const pricing = state?.pricing;
  const p = state?.product;
  const fmt = useMemo(() => currencyFmt(pricing?.currency || p?.currency), [pricing?.currency, p?.currency]);

  if (!pricing) return <div className={cn('pdp-block', className)} style={style} />;

  return (
    <div className={cn('pdp-block pdp-price', className)} style={style}>
      <span className="pdp-price__current">{fmt.format(Number(pricing.effectivePrice || 0))}</span>
      {pricing.compareAt ? (
        <span className="pdp-price__compare">{fmt.format(Number(pricing.compareAt || 0))}</span>
      ) : null}
    </div>
  );
}

export function PdpSaleBadge(props) {
  return (
    <RuntimeLeafProvider>
      <PdpSaleBadgeInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpSaleBadgeInner({ runtimeKey, product, style, className, text, label = 'Sale', hideWhenNotOnSale = true }) {
  const { state } = useProductState(runtimeKey, product);
  const onSale = Boolean(state?.pricing?.onSale);
  if (!onSale && hideWhenNotOnSale) return null;
  return (
    <span className={cn('pdp-sale-badge', className)} style={style}>
      {typeof text === 'string' && text.trim() ? text : label}
    </span>
  );
}

export function PdpStock(props) {
  return (
    <RuntimeLeafProvider>
      <PdpStockInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpStockInner({ runtimeKey, product, style, className, lowStockThreshold = 5 }) {
  const { state } = useProductState(runtimeKey, product);
  const stock = Number(state?.stock || 0);
  const low = Math.max(1, Math.floor(Number(lowStockThreshold) || 5));
  const status = stock <= 0 ? 'out' : stock <= low ? 'low' : 'in';
  const label = stock <= 0 ? 'Out of stock' : stock <= low ? `Low stock (${stock})` : `In stock (${stock})`;
  return (
    <div className={cn('pdp-block', `pdp-stock--${status}`, className)} style={style}>
      {label}
    </div>
  );
}

export function PdpQuantity(props) {
  return (
    <RuntimeLeafProvider>
      <PdpQuantityInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpQuantityInner({ runtimeKey, product, style, className, min = 1, max = 99 }) {
  const { state, setQuantity } = useProductState(runtimeKey, product);
  const qty = Math.max(Number(min) || 1, Math.min(Number(max) || 99, Number(state?.quantity || 1)));
  const clamp = (n) => Math.max(Number(min) || 1, Math.min(Number(max) || 99, Math.floor(Number(n) || 1)));

  return (
    <div className={cn('pdp-block', className)} style={style}>
      <div className="pdp-qty" aria-label="Quantity">
        <button type="button" onClick={() => setQuantity(clamp(qty - 1))} aria-label="Decrease quantity">
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={Number(min) || 1}
          max={Number(max) || 99}
          value={qty}
          onChange={(e) => setQuantity(clamp(e.target.value))}
          aria-label="Quantity"
        />
        <button type="button" onClick={() => setQuantity(clamp(qty + 1))} aria-label="Increase quantity">
          +
        </button>
      </div>
    </div>
  );
}

export function PdpAddToCart(props) {
  return (
    <RuntimeLeafProvider>
      <PdpAddToCartInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpAddToCartInner({
  runtimeKey,
  product,
  style,
  className,
  label = 'Add to cart',
  soldOutLabel = 'Sold out',
}) {
  const { state } = useProductState(runtimeKey, product);
  const { addItem, loading } = useCart();
  const stock = Number(state?.stock || 0);
  const disabled = loading || stock <= 0;

  const handle = useCallback(async () => {
    const p = state?.product;
    if (!p) return;
    const sku = state?.activeSku || p.sku || '';
    if (!sku) return;
    const qty = Math.max(1, Math.min(99, Number(state?.quantity || 1)));
    await addItem({
      sku,
      qty,
      title: p.title,
      price: Number(state?.pricing?.effectivePrice || p.effectivePrice || 0),
      image: state?.selectedVariant?.image || p.image || '',
      slug: p.slug,
    });
  }, [addItem, state]);

  return (
    <button
      type="button"
      className={cn('pdp-add-to-cart', className)}
      style={style}
      onClick={handle}
      disabled={disabled}
    >
      {loading ? 'Adding…' : stock <= 0 ? soldOutLabel : label}
    </button>
  );
}

export function PdpDescription(props) {
  return (
    <RuntimeLeafProvider>
      <PdpDescriptionInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpDescriptionInner({ runtimeKey, product, style, className, fallback = '' }) {
  const { state } = useProductState(runtimeKey, product);
  const text = state?.product?.description || fallback || '';
  if (!text) return null;
  return (
    <div className={cn('pdp-block', className)} style={style}>
      {text}
    </div>
  );
}

export function PdpSpecifications(props) {
  return (
    <RuntimeLeafProvider>
      <PdpSpecificationsInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpSpecificationsInner({ runtimeKey, product, style, className, title = 'Specifications' }) {
  const { state } = useProductState(runtimeKey, product);
  const rows = Array.isArray(state?.product?.specifications) ? state.product.specifications : [];
  if (!rows.length) return null;
  return (
    <div className={cn('pdp-block', className)} style={style}>
      {title ? <div style={{ fontWeight: 700, marginBottom: 10 }}>{title}</div> : null}
      <div>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
            <div style={{ minWidth: 140, opacity: 0.75 }}>{r.label}</div>
            <div style={{ flex: 1 }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PdpReviews(props) {
  return (
    <RuntimeLeafProvider>
      <PdpReviewsInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpReviewsInner({ runtimeKey, product, style, className, limit, pageSize = 6 }) {
  const { state, rk } = useProductState(runtimeKey, product);
  const { fetchInternal } = useRuntimeData();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const productSlug = state?.product?.slug || '';
  const sku = state?.activeSku || state?.product?.sku || '';
  const effectiveLimit = Math.min(24, Math.max(1, Math.floor(Number(limit ?? pageSize) || 6)));

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!rk || !productSlug) return;
      setLoading(true);
      setError('');
      try {
        const sp = new URLSearchParams();
        sp.set('limit', String(effectiveLimit));
        sp.set('offset', '0');
        sp.set('productSlug', productSlug);
        if (sku) sp.set('sku', sku);
        const json = await fetchInternal(`/api/runtime/data/reviews?${sp.toString()}`, { method: 'GET' });
        const list = Array.isArray(json?.data) ? json.data : [];
        if (alive) setRows(list);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [fetchInternal, rk, productSlug, sku, effectiveLimit]);

  const stats = useMemo(() => computeReviewStats(rows || []), [rows]);
  const list = Array.isArray(rows) ? rows : [];

  return (
    <div className={cn('pdp-block', className)} style={style}>
      <div className="pdp-reviews__summary">
        <strong>Reviews</strong>
        <span>
          {stats.count ? `${stats.average} / 5` : 'No reviews'}
        </span>
        {stats.count ? <span>({stats.count})</span> : null}
      </div>
      {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
      {loading && rows == null ? <div>Loading…</div> : null}
      {list.map((r) => (
        <div key={r.id ?? `${r.author}-${r.createdAt}`} className="pdp-reviews__item">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong>{r.author || 'Anonymous'}</strong>
            <span>{'★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)))}</span>
          </div>
          {r.text ? <div style={{ marginTop: 6, opacity: 0.9 }}>{r.text}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function PdpRelated(props) {
  return (
    <RuntimeLeafProvider>
      <PdpRelatedInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpRelatedInner({
  runtimeKey,
  product,
  style,
  className,
  limit = 4,
  hrefPrefix = '/product/',
  useCategory = true,
  useTags = false,
  featuredOnly = false,
  sortBy = '',
}) {
  const { state, rk } = useProductState(runtimeKey, product);
  const { fetchInternal } = useRuntimeData();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const p = state?.product;
  const query = useMemo(() => buildRelatedProductsQuery(p, { limit, useCategory, useTags, featuredOnly, sortBy }), [p, limit, useCategory, useTags, featuredOnly, sortBy]);
  const cacheKey = query ? query.toString() : '';

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!rk || !p?.slug) return;
      setLoading(true);
      setError('');
      try {
        const sp = new URLSearchParams(query);
        sp.set('excludeSlug', p.slug);
        const json = await fetchInternal(`/api/runtime/data/related-products?${sp.toString()}`, { method: 'GET' });
        const list = filterRelatedProducts(Array.isArray(json?.data) ? json.data : [], p, p.slug);
        if (alive) setRows(list);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [fetchInternal, rk, p?.slug, p?.category, cacheKey, query]);

  const list = Array.isArray(rows) ? rows : [];

  return (
    <div className={cn('pdp-block', className)} style={style}>
      {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
      {loading && rows == null ? <div>Loading…</div> : null}
      {list.length ? (
        <div className="pdp-related__grid">
          {list.map((it) => (
            <a key={it.slug || it.sku} className="pdp-related__card" href={`${hrefPrefix}${it.slug || ''}`}>
              {it.image ? <img src={it.image} alt={it.title || ''} /> : null}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{it.title || 'Product'}</div>
                <div style={{ opacity: 0.75, marginTop: 4 }}>{it.category || ''}</div>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PdpDeliveryEta(props) {
  return (
    <RuntimeLeafProvider>
      <PdpDeliveryEtaInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpDeliveryEtaInner({
  runtimeKey,
  product,
  style,
  className,
  prefix = 'Delivery in',
  suffix = '',
}) {
  const { state } = useProductState(runtimeKey, product);
  const days = Number(state?.product?.deliveryEtaDays || 0);
  if (!days) return null;
  return (
    <div className={cn('pdp-block', className)} style={style}>
      {prefix} {days} {suffix || (days === 1 ? 'day' : 'days')}
    </div>
  );
}

export function PdpBreadcrumbs(props) {
  return (
    <RuntimeLeafProvider>
      <PdpBreadcrumbsInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpBreadcrumbsInner({
  runtimeKey,
  product,
  style,
  className,
  showHome = true,
  showCategory = true,
  homeLabel = 'Home',
  homeHref = '/',
  categoryHref = '',
}) {
  const { state } = useProductState(runtimeKey, product);
  const p = state?.product;
  if (!p) return null;
  const cat = p.category || '';
  const catHref = categoryHref || (cat ? `/?category=${encodeURIComponent(cat)}` : '');
  return (
    <nav className={cn('pdp-breadcrumbs', className)} style={style} aria-label="Breadcrumb">
      {showHome ? <a href={homeHref}>{homeLabel}</a> : null}
      {cat && showCategory ? (
        <>
          <span aria-hidden="true">/</span>
          {catHref ? <a href={catHref}>{cat}</a> : <span>{cat}</span>}
        </>
      ) : null}
      <span aria-hidden="true">/</span>
      <span>{p.title || 'Product'}</span>
    </nav>
  );
}

