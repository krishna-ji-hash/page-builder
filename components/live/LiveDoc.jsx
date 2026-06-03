import LiveDocEffects from '@/components/live/LiveDocEffects';

/**
 * Published / preview document root. Server shell only — scroll observers run in LiveDocEffects
 * so PublishedLiveTree (RSC) is not wrapped by a client boundary (fixes ticker hydration mismatch).
 */
export default function LiveDoc({ children }) {
  return (
    <>
      <div className="live-doc" suppressHydrationWarning>
        {children}
      </div>
      <LiveDocEffects />
    </>
  );
}
