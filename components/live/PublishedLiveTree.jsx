import 'server-only';

import { renderTree } from '@/lib/liveRenderer';

/**
 * Server-only published page tree. Keeps renderTree out of the client bundle boundary
 * so SSR and hydration share one deterministic output (see liveRenderKeys).
 */
export default function PublishedLiveTree({ nodes, options = {} }) {
  return renderTree(nodes, options);
}
