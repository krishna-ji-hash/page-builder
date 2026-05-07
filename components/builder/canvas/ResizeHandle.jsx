'use client';

export default function ResizeHandle({
  onMouseDown,
  disabled = false,
  className = '',
  title = 'Drag to resize',
  ariaLabel = 'Drag to resize',
  icon = '↘',
}) {
  const stopBubble = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      className={`bld-transform-handle bld-transform-handle--resize ${className}`.trim()}
      title={title}
      aria-label={ariaLabel}
      onPointerDown={stopBubble}
      onMouseDown={(event) => {
        stopBubble(event);
        onMouseDown?.(event);
      }}
      onClick={stopBubble}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
