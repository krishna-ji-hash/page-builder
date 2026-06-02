'use client';

import { normalizeToolbarTextAlign } from '@/lib/toolbarTextAlign';

export function WpIconAlignLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 4h18v2H3V4zm0 7h14v2H3v-2zm0 7h18v2H3v-2z" />
    </svg>
  );
}

export function WpIconAlignCenter() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 4h18v2H3V4zm2 7h14v2H5v-2zm-2 7h18v2H3v-2z" />
    </svg>
  );
}

export function WpIconAlignRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 4h18v2H3V4zm4 7h14v2H7v-2zm-4 7h18v2H3v-2z" />
    </svg>
  );
}

const ALIGN_OPTIONS = [
  { value: 'left', Icon: WpIconAlignLeft, label: 'Align left' },
  { value: 'center', Icon: WpIconAlignCenter, label: 'Align center' },
  { value: 'right', Icon: WpIconAlignRight, label: 'Align right' },
];

/**
 * Segmented left / center / right control for canvas toolbar and inspector.
 */
export default function TextAlignToolbarGroup({
  value = 'left',
  onChange,
  className = '',
  disabled = false,
  variant = 'wp-toolbar',
}) {
  const current = normalizeToolbarTextAlign(value);

  return (
    <div
      className={['bld-text-align-group', `bld-text-align-group--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Text alignment"
    >
      {ALIGN_OPTIONS.map(({ value: side, Icon, label }) => {
        const active = current === side;
        return (
          <button
            key={side}
            type="button"
            className={`bld-text-align-group__btn ${active ? 'is-active' : ''}`}
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => {
              if (variant === 'wp-toolbar') event.preventDefault();
            }}
            onClick={() => {
              if (!disabled && onChange) onChange(side);
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
