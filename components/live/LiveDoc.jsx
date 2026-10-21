import LiveDocEffects from '@/components/live/LiveDocEffects';

/**
 * Published / preview document root. Server shell only — scroll observers run in LiveDocEffects
 * so PublishedLiveTree (RSC) is not wrapped by a client boundary (fixes ticker hydration mismatch).
 */
export default function LiveDoc({ children, device = null, responsiveCss = '' }) {
  const deviceAttr =
    device === 'desktop' || device === 'tablet' || device === 'mobile' ? device : undefined;
  const css = typeof responsiveCss === 'string' ? responsiveCss.trim() : '';
  return (
    <>
      <div
        className="live-doc"
        {...(deviceAttr ? { 'data-bld-device': deviceAttr } : {})}
        suppressHydrationWarning
      >
        {css ? <style data-live-responsive dangerouslySetInnerHTML={{ __html: css }} /> : null}
        {children}
      </div>
      <LiveDocEffects />
    </>
  );
}
