'use client';

import { useContext } from 'react';
import { RuntimeDataContext, RuntimeProvider } from './RuntimeProvider';

/**
 * Ensures runtime context for a single client leaf (form, table, action button)
 * without wrapping the full published page tree in a client boundary.
 */
export function RuntimeLeafProvider({ children }) {
  const ctx = useContext(RuntimeDataContext);
  if (ctx) return children;
  return <RuntimeProvider>{children}</RuntimeProvider>;
}
