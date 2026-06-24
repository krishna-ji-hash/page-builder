'use client';

import dynamic from 'next/dynamic';

/** Builder uses @dnd-kit (browser-only). Skip SSR to avoid vendor-chunk / hook errors in dev. */
const BuilderShell = dynamic(() => import('@/components/builder/BuilderShell'), {
  ssr: false,
  loading: () => (
    <div className="bld-shell-loading" style={{ padding: 24, color: '#64748b' }}>
      Loading builder…
    </div>
  ),
});

export default function BuilderShellClient({ pageId, apiMode = 'legacy' }) {
  return <BuilderShell pageId={pageId} apiMode={apiMode} />;
}
