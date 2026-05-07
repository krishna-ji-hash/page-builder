'use client';

const BREAKPOINTS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
];

export default function ResponsiveVisibilityControls({
  desktopHidden,
  tabletHidden,
  mobileHidden,
  onChange,
  disabled = false,
}) {
  const state = { desktop: desktopHidden, tablet: tabletHidden, mobile: mobileHidden };

  return (
    <div className="bld-responsive-visibility">
      <p className="bld-field-note" style={{ marginBottom: 10 }}>
        Show or hide this layer on each breakpoint. Overrides are stored only on the breakpoint you change.
      </p>
      {BREAKPOINTS.map((bp) => (
        <div key={bp.id} className="bld-field bld-field--row">
          <label className="bld-label" htmlFor={`bld-vis-${bp.id}`}>
            {bp.label}
          </label>
          <select
            id={`bld-vis-${bp.id}`}
            className="bld-input"
            disabled={disabled}
            value={state[bp.id] ? 'hide' : 'show'}
            onChange={(e) => onChange(bp.id, e.target.value === 'show')}
          >
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>
      ))}
    </div>
  );
}
