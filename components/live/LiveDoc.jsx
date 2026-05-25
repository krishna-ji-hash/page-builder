/**
 * Published / preview document root. suppressHydrationWarning avoids dev-only noise when
 * hot-reloaded client bundles briefly diverge from the server render during hydration.
 */
export default function LiveDoc({ children }) {
  return (
    <div className="live-doc" suppressHydrationWarning>
      {children}
    </div>
  );
}
