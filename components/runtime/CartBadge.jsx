'use client';

import { RuntimeLeafProvider } from './RuntimeLeafProvider';
import { useCart } from './CartProvider';

export default function CartBadge({ label = 'Cart', href = '/cart', className = '' }) {
  return (
    <RuntimeLeafProvider>
      <CartBadgeInner label={label} href={href} className={className} />
    </RuntimeLeafProvider>
  );
}

function CartBadgeInner({ label, href, className }) {
  const { count } = useCart();
  return (
    <a href={href} className={`bld-cart-badge ${className}`.trim()} aria-label={`${label} (${count})`}>
      <span className="bld-cart-badge__label">{label}</span>
      <span className="bld-cart-badge__count">{count}</span>
    </a>
  );
}

