'use client';

import { useEffect, useRef } from 'react';
import { bindInteractionObservers } from '@/lib/interactionScrollRuntime';

/**
 * Published / preview document root. suppressHydrationWarning avoids dev-only noise when
 * hot-reloaded client bundles briefly diverge from the server render during hydration.
 */
export default function LiveDoc({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    return bindInteractionObservers(ref.current);
  }, []);

  return (
    <div ref={ref} className="live-doc" suppressHydrationWarning>
      {children}
    </div>
  );
}
