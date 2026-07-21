import { findFirstLcpImageUrl } from '@/lib/findLcpImageUrl';
import { isFirstLcpFromCarousel } from '@/lib/liveCarouselImage';

/**
 * Preload the first hero/LCP image discovered in the published tree (real asset only).
 * Skips carousel first slides — LiveCarouselImage priority handles those (avoids duplicate fetch).
 */
export default function LcpImagePreload({ nodes }) {
  if (isFirstLcpFromCarousel(nodes)) return null;
  const href = findFirstLcpImageUrl(nodes);
  if (!href || href.startsWith('data:')) return null;
  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
