'use client';

const DEVICES = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
];

export default function InspectorResponsiveBar({
  device = 'desktop',
  onDeviceChange,
  hasTabletOverrides = false,
  hasMobileOverrides = false,
  onResetTablet,
  onResetMobile,
  onCopyDesktopToTablet,
  onCopyDesktopToMobile,
  /** When true, reset buttons are disabled (e.g. nothing selected). */
  disableResets = false,
}) {
  const editingLabel = DEVICES.find((d) => d.id === device)?.label || 'Desktop';

  return (
    <div className="bld-inspector-device" aria-label="Preview and style breakpoint">
      <div className="bld-inspector-device__row">
        <div className="bld-inspector-device__pills" role="tablist" aria-label="Device">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={device === d.id}
              className={`bld-inspector-device__pill ${device === d.id ? 'is-active' : ''}`}
              disabled={typeof onDeviceChange !== 'function'}
              onClick={() => onDeviceChange?.(d.id)}
            >
              {d.label}
              {d.id === 'tablet' && hasTabletOverrides ? <span className="bld-inspector-device__dot" aria-hidden /> : null}
              {d.id === 'mobile' && hasMobileOverrides ? <span className="bld-inspector-device__dot" aria-hidden /> : null}
            </button>
          ))}
        </div>
        <p className="bld-inspector-device__editing">
          Editing: <strong>{editingLabel}</strong>
        </p>
      </div>
      <div className="bld-inspector-device__resets">
        <button
          type="button"
          className="bld-inspector-device__reset"
          disabled={disableResets || typeof onCopyDesktopToTablet !== 'function'}
          onClick={onCopyDesktopToTablet}
          title="Copy desktop styles into tablet override layer (one-time)."
        >
          Copy desktop → tablet
        </button>
        <button
          type="button"
          className="bld-inspector-device__reset"
          disabled={disableResets || typeof onCopyDesktopToMobile !== 'function'}
          onClick={onCopyDesktopToMobile}
          title="Copy desktop styles into mobile override layer (one-time)."
        >
          Copy desktop → mobile
        </button>
        <button
          type="button"
          className="bld-inspector-device__reset"
          disabled={disableResets || !hasTabletOverrides}
          onClick={onResetTablet}
          title="Remove all tablet-only overrides for this node"
        >
          Reset tablet styles
        </button>
        <button
          type="button"
          className="bld-inspector-device__reset"
          disabled={disableResets || !hasMobileOverrides}
          onClick={onResetMobile}
          title="Remove all mobile-only overrides for this node"
        >
          Reset mobile styles
        </button>
      </div>
    </div>
  );
}
