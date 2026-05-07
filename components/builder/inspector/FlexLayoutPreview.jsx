'use client';

/** Compact visual for main axis vs cross axis (no layout CSS on live canvas). */
export default function FlexLayoutPreview({ flexDirection = 'row', justifyContent = 'flex-start', alignItems = 'stretch' }) {
  const col = flexDirection === 'column';
  return (
    <div className="bld-flex-preview" aria-hidden>
      <div
        className={`bld-flex-preview__frame ${col ? 'bld-flex-preview__frame--col' : 'bld-flex-preview__frame--row'}`}
        style={{ justifyContent, alignItems }}
      >
        <span className="bld-flex-preview__item" />
        <span className="bld-flex-preview__item" />
        <span className="bld-flex-preview__item" />
      </div>
      <div className="bld-flex-preview__meta">
        {col ? 'Column' : 'Row'} · {justifyContent} · {alignItems}
      </div>
    </div>
  );
}
