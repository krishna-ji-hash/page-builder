'use client';

import { useEffect } from 'react';
import { bindInteractionObservers } from '@/lib/interactionScrollRuntime';
import { bindHeaderBehaviorScroll } from '@/lib/headerBehaviorScroll';

/** Binds scroll/interaction observers on `.live-doc` without wrapping RSC children (avoids hydration mismatch). */
export default function LiveDocEffects() {
  useEffect(() => {
    const root = document.querySelector('.live-doc');
    if (!root) return undefined;
    const unbindIx = bindInteractionObservers(root);
    const unbindHeader = bindHeaderBehaviorScroll(root);
    return () => {
      unbindIx?.();
      unbindHeader?.();
    };
  }, []);
  return null;
}
