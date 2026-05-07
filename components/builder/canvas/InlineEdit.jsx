'use client';

import { useEffect, useRef } from 'react';

export default function InlineEdit({
  value,
  onChange,
  onCommit,
  onCancel,
  disabled = false,
  className = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // Initialize editor text once when edit mode opens.
    ref.current.innerText = value || '';
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onClick={(event) => event.stopPropagation()}
      onInput={(event) => {
        event.stopPropagation();
        onChange(event.currentTarget.innerText);
      }}
      onBlur={onCommit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onCommit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
