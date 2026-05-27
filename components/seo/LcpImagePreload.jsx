import { findFirstLcpImageUrl } from '@/lib/findLcpImageUrl';

/**
 * Preload the first hero/LCP image discovered in the published tree (real asset only).
 */
export default function LcpImagePreload({ nodes }) {
  const href = findFirstLcpImageUrl(nodes);
  if (!href || href.startsWith('data:')) return null;
  return <link rel="preload" as="image" href={href} fetchPriority="high" />;
}
