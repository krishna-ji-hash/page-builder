'use client';

import { hex6ForColorInput } from '@/lib/colorInputUtils';

export default function InspectorColorInput({
  id,
  value,
  fallback = '#ffffff',
  onChange,
  className = '',
  'aria-label': ariaLabel,
  onMouseDown,
}) {
  const hex = hex6ForColorInput(value, fallback);

  return (
    <input
      id={id}
      type="color"
      className={`bld-input bld-color-input${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      value={hex}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={onMouseDown}
    />
  );
}
