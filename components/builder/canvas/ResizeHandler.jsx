'use client';

export default function ResizeHandler({ onMouseDown, disabled = false }) {
  return (
    <button
      type="button"
      className="bld-transform-handle bld-transform-handle--resize"
      title="Drag to resize"
      onMouseDown={onMouseDown}
      onClick={(event) => event.stopPropagation()}
      disabled={disabled}
    >
      ↘
    </button>
  );
}
