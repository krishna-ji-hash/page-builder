'use client';

export default function InspectorTipChips({ chips, className = '', style, size, id }) {
  const sizeClass = size === 'xs' ? 'bld-inspector-tip--xs' : '';
  return (
    <div id={id} className={`bld-inspector-tip ${sizeClass} ${className}`.trim()} style={style}>
      <div className="bld-inspector-tip__chips" role="note">
        {chips.map((text) => (
          <span key={text} className="bld-inspector-tip__chip">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
