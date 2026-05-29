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
import { getRelatedCache, setRelatedCache } from '@/lib/runtime/productRuntimeStore';

function currencySymbol(code) {
  const c = String(code || '').toUpperCase();
  if (c === 'INR') return '₹';
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return '';
}

function formatMoney(amount, currency) {
  const n = Number(amount || 0);
  const sym = currencySymbol(currency);
  const value = Number.isFinite(n) ? n.toFixed(n % 1 === 0 ? 0 : 2) : '0';
  return sym ? `${sym}${value}` : `${value} ${String(currency || '').toUpperCase() || 'USD'}`;
}

function usePdpState(runtimeKey, initialProduct) {
  return useProductRuntime(runtimeKey, initialProduct);
}

export function PdpBreadcrumbs(props) {
  return (
    <RuntimeLeafProvider>
      <PdpBreadcrumbsInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpBreadcrumbsInner({ className, style, runtimeKey, product, showHome = true, showCategory = true, projectSlug }) {
  const { state } = usePdpState(runtimeKey, product);
  const p = state?.product || product;
  const crumbs = [];
  if (showHome) crumbs.push({ label: 'Home', href: projectSlug ? `/${projectSlug}` : '/' });
  if (showCategory && p?.category) crumbs.push({ label: p.category, href: '#' });
  crumbs.push({ label: p?.title || 'Product', href: null });
  return (
    <nav className={`pdp-block pdp-breadcrumbs ${className || ''}`.trim()} style={style} aria-label="Breadcrumbs">
      {crumbs.map((c, idx) => (
        <span key={idx}>
          {idx > 0 ? <span aria-hidden="true">›</span> : null}{' '}
          {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PdpGallery(props) {
  return (
    <RuntimeLeafProvider>
      <PdpGalleryInner {...props} />
    </RuntimeLeafProvider>
  );
}

function PdpGalleryInner({ className, style, runtimeKey, product, layout = 'thumbnails-left', enableSwipe = true, lazyLoad = true }) {
  const { state, setGalleryIndex } = usePdpState(runtimeKey, product);
  const gallery = state?.gallery || [];
  const active = state?.activeImageIndex || 0;
  const mainSrc = gallery[active] || gallery[0] || '';
  const isThumbsLeft = layout === 'thumbnails-left';

  const onTouch = useMemo(() => {
    if (!enableSwipe) return null;
    let startX = 0;
    return {
      onTouchStart: (e) => {
        startX = e.touches?.[0]?.clientX || 0;
      },
      onTouchEnd: (e) => {
        const endX = e.changedTouches?.[0]?.clientX || 0;
        const dx = endX - startX;
        if (Math.abs(dx) < 30) return;
        const dir = dx < 0 ? 1 : -1;
        setGalleryIndex(Math.max(0, Math.min((gallery.length || 1) - 1, active + dir)));
      },
    };
  }, [enableSwipe, gallery.length, active, setGalleryIndex]);

  return (
    <div
      className={`pdp-block pdp-gallery ${isThumbsLeft ? 'pdp-gallery--thumbs-left' : ''} ${className || ''}`.trim()}
      style={style}
    >
      {isThumbsLeft ? (
        <div className="pdp-gallery__thumbs" aria-label="Product images">
          {gallery.map((src, idx) => (
            <button
              key={src || idx}
              type="button"
              className={`pdp-gallery__thumb ${idx === active ? 'is-active' : ''}`.trim()}
              onClick={() => setGalleryIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={src} alt="" loading={lazyLoad ? 'lazy' : 'eager'} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="pdp-gallery__main" {...(onTouch || {})}>
        {mainSrc ? <img src={mainSrc} alt="" loading={lazyLoad ? 'lazy' : 'eager'} /> : null}
      </div>

      {!isThumbsLeft ? (
        <div className="pdp-gallery__thumbs" aria-label="Product images">
          {gallery.map((src, idx) => (
            <button
              key={src || idx}
              type="button"
              className={`pdp-gallery__thumb ${idx === active ? 'is-active' : ''}`.trim()}
              onClick={() => setGalleryIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={src} alt="" loading={lazyLoad ? 'lazy' : 'eager'} />
            </button>
          ))}
        </div>
      ) : null}
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

function PdpImageZoomInner({ className, style, runtimeKey, product, lightbox = true }) {
  const { state } = usePdpState(runtimeKey, product);
  const src = (state?.gallery || [])[state?.activeImageIndex || 0] || state?.gallery?.[0] || product?.image || '';
  const [zoomed, setZoomed] = useState(false);
  const toggle = useCallback(() => setZoomed((z) => !z), []);
  const open = useCallback(() => {
    if (!lightbox || !src) return;
    window.open(src, '_blank', 'noopener,noreferrer');
  }, [lightbox, src]);
  return (
    <div className={`pdp-block pdp-zoom ${zoomed ? 'is-zoomed' : ''} ${className || ''}`.trim()} style={style}>
      {src ? (
        <img
          src={src}
          alt=""
          onClick={() => (zoomed ? toggle() : open())}
          onDoubleClick={toggle}
          loading="lazy"
        />
      ) : null}
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

function PdpVariantSelectorInner({ className, style, runtimeKey, product, optionKeys = [] }) {
  const { state, selectOptions } = usePdpState(runtimeKey, product);
  const p = state?.product || product;
  const keys = Array.isArray(optionKeys) && optionKeys.length ? optionKeys : p?.variantOptionKeys || [];
  if (!keys.length) return null;
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      {keys.map((k) => {
        const values = variantOptionValues(p, k);
        if (!values.length) return null;
        const selected = state?.selectedOptions?.[k] || '';
        return (
          <div key={k} className="pdp-variant__group">
            <span className="pdp-variant__label">{k}</span>
            <div className="pdp-variant__options">
              {values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`pdp-variant__pill ${selected === v ? 'is-selected' : ''}`.trim()}
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

function PdpPriceInner({ className, style, runtimeKey, product, showCompareAt = true, showCurrency = true }) {
  const { state } = usePdpState(runtimeKey, product);
  const pricing = state?.pricing;
  if (!pricing) return null;
  const current = formatMoney(pricing.effectivePrice, pricing.currency);
  const compare = pricing.compareAt != null ? formatMoney(pricing.compareAt, pricing.currency) : '';
  return (
    <div className={`pdp-block pdp-price ${className || ''}`.trim()} style={style}>
      <span className="pdp-price__current">
        {current}
        {!showCurrency ? null : null}
      </span>
      {showCompareAt && compare ? <span className="pdp-price__compare">{compare}</span> : null}
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

function PdpSaleBadgeInner({ className, style, runtimeKey, product, label = 'Sale', hideWhenNotOnSale = true }) {
  const { state } = usePdpState(runtimeKey, product);
  const onSale = Boolean(state?.pricing?.onSale);
  if (hideWhenNotOnSale && !onSale) return null;
  return (
    <span className={`pdp-block pdp-sale-badge ${className || ''}`.trim()} style={style}>
      {label}
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

function PdpStockInner({
  className,
  style,
  runtimeKey,
  product,
  lowStockThreshold = 5,
  hideWhenOutOfStock = false,
}) {
  const { state } = usePdpState(runtimeKey, product);
  const stock = Number(state?.stock || 0);
  if (hideWhenOutOfStock && stock <= 0) return null;
  const kind = stock <= 0 ? 'out' : stock <= lowStockThreshold ? 'low' : 'in';
  const text = stock <= 0 ? 'Out of stock' : stock <= lowStockThreshold ? `Low stock (${stock})` : 'In stock';
  return (
    <div className={`pdp-block pdp-stock--${kind} ${className || ''}`.trim()} style={style}>
      {text}
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

function PdpQuantityInner({ className, style, runtimeKey, product, min = 1, max = 99 }) {
  const { state, setQuantity } = usePdpState(runtimeKey, product);
  const qty = Number(state?.quantity || 1);
  const dec = () => setQuantity(Math.max(min, qty - 1));
  const inc = () => setQuantity(Math.min(max, qty + 1));
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      <div className="pdp-qty" aria-label="Quantity selector">
        <button type="button" onClick={dec} aria-label="Decrease quantity">
          −
        </button>
        <input
          value={qty}
          onChange={(e) => setQuantity(e.target.value)}
          inputMode="numeric"
          aria-label="Quantity"
        />
        <button type="button" onClick={inc} aria-label="Increase quantity">
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

function PdpAddToCartInner({ className, style, runtimeKey, product, label = 'Add to cart', soldOutLabel = 'Sold out' }) {
  const { state } = usePdpState(runtimeKey, product);
  const { addItem } = useCart();
  const { showToast, bumpRefresh } = useRuntimeData();
  const stock = Number(state?.stock || 0);
  const disabled = stock <= 0;
  const handle = useCallback(async () => {
    if (disabled) return;
    const p = state.product;
    const sku = state.activeSku;
    if (!sku) return;
    const variantLabel =
      state.selectedVariant?.title ||
      Object.values(state.selectedOptions || {}).filter(Boolean).join(' / ') ||
      '';
    await addItem({
      sku,
      title: p?.title || 'Product',
      price: state.pricing?.effectivePrice ?? p?.effectivePrice ?? 0,
      qty: state.quantity || 1,
      image: (state.gallery || [])[0] || p?.image || '',
      variant: variantLabel,
      productId: p?.id ?? null,
    });
    bumpRefresh('cart');
    showToast('Added to cart', 'success');
  }, [addItem, bumpRefresh, disabled, showToast, state]);
  return (
    <button
      type="button"
      className={`pdp-block pdp-add-to-cart ${className || ''}`.trim()}
      style={style}
      disabled={disabled}
      onClick={handle}
    >
      {disabled ? soldOutLabel : label}
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

function PdpDescriptionInner({ className, style, runtimeKey, product }) {
  const { state } = usePdpState(runtimeKey, product);
  const desc = state?.product?.description || '';
  if (!desc) return null;
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      {desc}
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

function PdpSpecificationsInner({ className, style, runtimeKey, product }) {
  const { state } = usePdpState(runtimeKey, product);
  const specs = Array.isArray(state?.product?.specifications) ? state.product.specifications : [];
  if (!specs.length) return null;
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {specs.map((s) => (
            <tr key={s.label}>
              <td style={{ padding: '8px 10px', fontWeight: 600, borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                {s.label}
              </td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

function PdpDeliveryEtaInner({ className, style, runtimeKey, product, prefix = 'Delivery in', suffix = 'business days' }) {
  const { state } = usePdpState(runtimeKey, product);
  const days = Number(state?.product?.deliveryEtaDays || 0);
  if (!days) return null;
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      {prefix} {days} {suffix}
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

function PdpReviewsInner({
  className,
  style,
  runtimeKey,
  product,
  pageSize = 5,
  sortBy = 'rating',
  showAverage = true,
  allowRatingFilter = true,
}) {
  const { fetchInternal } = useRuntimeData();
  const { state } = usePdpState(runtimeKey, product);
  const p = state?.product || product;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const sp = new URLSearchParams();
        sp.set('limit', String(pageSize));
        sp.set('offset', String(page * pageSize));
        sp.set('sortBy', String(sortBy || ''));
        if (minRating) sp.set('minRating', String(minRating));
        if (p?.slug) sp.set('productSlug', p.slug);
        if (state?.activeSku) sp.set('sku', state.activeSku);
        const data = await fetchInternal(`/api/runtime/data/reviews?${sp.toString()}`);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load reviews');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchInternal, page, pageSize, p?.slug, sortBy, minRating, state?.activeSku]);

  const stats = useMemo(() => computeReviewStats(rows), [rows]);
  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      {showAverage ? (
        <div className="pdp-reviews__summary">
          <strong>{stats.average || 0}</strong>
          <span>({stats.count} reviews)</span>
          {allowRatingFilter ? (
            <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value) || 0)} aria-label="Minimum rating">
              <option value={0}>All ratings</option>
              <option value={5}>5★</option>
              <option value={4}>4★ & up</option>
              <option value={3}>3★ & up</option>
              <option value={2}>2★ & up</option>
              <option value={1}>1★ & up</option>
            </select>
          ) : null}
        </div>
      ) : null}
      {loading ? <div>Loading reviews…</div> : null}
      {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
      {!loading && !error && !rows.length ? <div>No reviews yet.</div> : null}
      {rows.map((r) => (
        <div key={r.id || `${r.author}-${r.createdAt}`} className="pdp-reviews__item">
          <div style={{ fontWeight: 700 }}>{r.author || 'Anonymous'}</div>
          <div>{'★'.repeat(Math.max(1, Math.min(5, Number(r.rating || 5))))}</div>
          <div>{r.text}</div>
        </div>
      ))}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          Prev
        </button>
        <button type="button" onClick={() => setPage((p) => p + 1)} disabled={rows.length < pageSize}>
          Next
        </button>
      </div>
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
  className,
  style,
  runtimeKey,
  product,
  projectSlug,
  limit = 4,
  columns = 2,
  useCategory = true,
  useTags = false,
}) {
  const { fetchInternal } = useRuntimeData();
  const { state } = usePdpState(runtimeKey, product);
  const p = state?.product || product;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!p?.slug) return;
      const q = buildRelatedProductsQuery(p, { limit, useCategory, useTags });
      q.set('excludeSlug', p.slug);
      const cacheKey = `related:${q.toString()}`;
      const hit = getRelatedCache(runtimeKey, cacheKey, 60_000);
      if (hit) {
        setRows(hit);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await fetchInternal(`/api/runtime/data/related-products?${q.toString()}`);
        const filtered = filterRelatedProducts(data, p, p.slug).slice(0, limit);
        if (!cancelled) {
          setRows(filtered);
          setRelatedCache(runtimeKey, cacheKey, filtered);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load related products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchInternal, limit, p?.slug, p?.category, runtimeKey, useCategory, useTags]);

  const gridStyle = useMemo(() => ({ gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, Number(columns) || 2))}, 1fr)` }), [columns]);

  return (
    <div className={`pdp-block ${className || ''}`.trim()} style={style}>
      {loading ? <div>Loading related…</div> : null}
      {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
      {!loading && !error ? (
        <div className="pdp-related__grid" style={gridStyle}>
          {rows.map((row) => (
            <a
              key={row.slug || row.id}
              href={row.slug ? (projectSlug ? `/${projectSlug}/product/${row.slug}` : `/product/${row.slug}`) : '#'}
              className="pdp-related__card"
            >
              {row.image ? <img src={row.image} alt="" loading="lazy" /> : null}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{row.title}</div>
                <div style={{ opacity: 0.75 }}>{formatMoney(row.effectivePrice, row.currency)}</div>
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

