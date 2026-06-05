'use client';

import { useEffect, useRef } from 'react';
import { shouldDeferInlineEditBlurCommit } from '@/lib/inlineEditBlurGuard';
import { syncInlineFontSizeHostFromHtml } from '@/lib/inlineFontSize';

export default function InlineEdit({
  value,
  onChange,
  onCommit,
  onCancel,
  disabled = false,
  className = '',
  multiline = false,
  htmlMode = false,
  /** When true, skip blur-to-commit (e.g. native color picker open on floating toolbar). */
  blurCommitGuard,
}) {
  const ref = useRef(null);

  const handleBlur = (event) => {
    const sessionOpen = typeof blurCommitGuard === 'function' ? Boolean(blurCommitGuard()) : false;
    if (shouldDeferInlineEditBlurCommit(event, sessionOpen)) return;
    window.setTimeout(() => {
      const open = typeof blurCommitGuard === 'function' ? Boolean(blurCommitGuard()) : false;
      if (shouldDeferInlineEditBlurCommit(event, open)) return;
      onCommit();
    }, 0);
  };

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    if (htmlMode) {
      el.innerHTML = value || '';
      syncInlineFontSizeHostFromHtml(el, value || '');
    } else {
      el.innerText = value || '';
      syncInlineFontSizeHostFromHtml(el, '');
    }
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when inline editor mounts
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={multiline || htmlMode ? { whiteSpace: 'pre-wrap', minHeight: '4em' } : undefined}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onClick={(event) => event.stopPropagation()}
      onInput={(event) => {
        event.stopPropagation();
        const el = event.currentTarget;
        onChange(htmlMode ? el.innerHTML : el.innerText);
      }}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter' && !event.shiftKey && !multiline && !htmlMode) {
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
