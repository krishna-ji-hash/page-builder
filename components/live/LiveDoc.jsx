import LiveDocEffects from '@/components/live/LiveDocEffects';

/**
 * Published / preview document root. Server shell only — scroll observers run in LiveDocEffects
 * so PublishedLiveTree (RSC) is not wrapped by a client boundary (fixes ticker hydration mismatch).
 */
export default function LiveDoc({ children, device = null }) {
  const deviceAttr =
    device === 'desktop' || device === 'tablet' || device === 'mobile' ? device : undefined;
  return (
    <>
      <div
        className="live-doc"
        {...(deviceAttr ? { 'data-bld-device': deviceAttr } : {})}
        suppressHydrationWarning
      >
        {children}
      </div>
      <LiveDocEffects />
    </>
  );
}
