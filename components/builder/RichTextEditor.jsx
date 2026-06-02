'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';

const TOOLBAR_APPROX_HEIGHT = 56;
const TOOLBAR_GAP = 8;

function computeDockedToolbarPlacement(editorEl) {
  if (!editorEl || typeof window === 'undefined') return null;
  const r = editorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxWidth = Math.min(560, vw - 16);
  let left = r.left;
  left = Math.max(8, Math.min(left, vw - maxWidth - 8));

  const spaceAbove = r.top;
  const spaceBelow = vh - r.bottom;
  const need = TOOLBAR_APPROX_HEIGHT + TOOLBAR_GAP;
  let top;
  let transform;
  if (spaceAbove >= need || spaceAbove >= spaceBelow) {
    top = r.top - TOOLBAR_GAP;
    transform = 'translateY(-100%)';
  } else {
    top = r.bottom + TOOLBAR_GAP;
    transform = 'translateY(0)';
  }
  return { top, left, maxWidth, transform };
}

function exec(cmd, val = false) {
  if (typeof document === 'undefined') return false;
  try {
    document.execCommand('styleWithCSS', false, true);
    return document.execCommand(cmd, false, val);
  } catch {
    return false;
  }
}

function ToolbarButton({ onMouseDown, children, title }) {
  return (
    <button type="button" className="bld-rich-text__toolbar-btn" title={title} onMouseDown={onMouseDown}>
      {children}
    </button>
  );
}

function DockedRichToolbar({
  visible,
  placement,
  onFontSize,
  onLetterSpacing,
  onColor,
  onLink,
  onAlign,
  onHeading,
  onBold,
  onItalic,
  onUnderline,
}) {
  if (!visible || !placement || typeof document === 'undefined') return null;

  const sty = {
    position: 'fixed',
    top: placement.top,
    left: placement.left,
    maxWidth: placement.maxWidth,
    transform: placement.transform,
    zIndex: 10000,
  };

  return createPortal(
    <div
      className="bld-rich-text__toolbar bld-rich-text__toolbar--docked"
      style={sty}
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="bld-rich-text__toolbar-row bld-rich-text__toolbar-row--canvas">
        {['h1', 'h2', 'h3', 'p'].map((tag) => (
          <ToolbarButton
            key={tag}
            title={tag === 'p' ? 'Paragraph' : tag.toUpperCase()}
            onMouseDown={(e) => {
              e.preventDefault();
              onHeading(tag);
            }}
          >
            {tag === 'p' ? '¶' : tag.toUpperCase()}
          </ToolbarButton>
        ))}
        <ToolbarButton title="Bold (Ctrl+B)" onMouseDown={(e) => { e.preventDefault(); onBold(); }}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton title="Italic" onMouseDown={(e) => { e.preventDefault(); onItalic(); }}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton title="Underline" onMouseDown={(e) => { e.preventDefault(); onUnderline(); }}>
          <u>U</u>
        </ToolbarButton>
        <label className="bld-rich-text__toolbar-label bld-rich-text__toolbar-label--compact">
          <select
            className="bld-rich-text__toolbar-select"
            defaultValue="16"
            onChange={(e) => onFontSize(e.target.value)}
            title="Font size"
          >
            {['12', '14', '16', '18', '20', '24', '28', '32', '36'].map((n) => (
              <option key={n} value={n}>{`${n}px`}</option>
            ))}
          </select>
        </label>
        <label className="bld-rich-text__toolbar-label bld-rich-text__toolbar-label--compact" title="Letter spacing">
          <select className="bld-rich-text__toolbar-select" defaultValue="0" onChange={(e) => onLetterSpacing(e.target.value)}>
            {['-1', '0', '0.5', '1', '1.5', '2', '3'].map((n) => (
              <option key={n} value={n}>{`LS ${n}`}</option>
            ))}
          </select>
        </label>
        <label className="bld-rich-text__toolbar-label bld-rich-text__toolbar-label--compact" title="Text color">
          <input type="color" className="bld-rich-text__toolbar-color" defaultValue="#0f172a" onChange={(e) => onColor(e.target.value)} />
        </label>
        <ToolbarButton title="Link" onMouseDown={(e) => { e.preventDefault(); onLink(); }}>
          🔗
        </ToolbarButton>
        <ToolbarButton title="Align left" onMouseDown={(e) => { e.preventDefault(); onAlign('left'); }}>
          ◀
        </ToolbarButton>
        <ToolbarButton title="Align center" onMouseDown={(e) => { e.preventDefault(); onAlign('center'); }}>
          ●
        </ToolbarButton>
        <ToolbarButton title="Align right" onMouseDown={(e) => { e.preventDefault(); onAlign('right'); }}>
          ▶
        </ToolbarButton>
      </div>
    </div>,
    document.body
  );
}

/**
 * Inline rich text for builder canvas — double‑click edits; formatting toolbar docks to the
 * editor box (not the text selection) so it never sits on top of the paragraph.
 */
export default function RichTextEditor({
  html,
  isEditing,
  onStartEdit,
  onCommit,
  onRuntimePersist,
  onCancel,
  disabled,
  className = '',
  style,
  neutralizeBodyColorsPreview = false,
  neutralizeBodyColorsPersist = false,
}) {
  const editableRef = useRef(null);
  const snapshotRef = useRef('');
  const wasEditingRef = useRef(false);
  const lastCommittedRef = useRef('');
  const dockRafRef = useRef(0);
  const runtimePersistTimerRef = useRef(null);
  const [toolbarPlacement, setToolbarPlacement] = useState(null);

  const sanitizeOptsPreview = { neutralizeHardcodedBodyTextColors: Boolean(neutralizeBodyColorsPreview) };
  const sanitizeOptsPersist = { neutralizeHardcodedBodyTextColors: Boolean(neutralizeBodyColorsPersist) };

  const safePreview = sanitizeRichHtml(html || '<p></p>', sanitizeOptsPreview);

  const updateDockedToolbar = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = editableRef.current;
    if (!el || !isEditing) {
      setToolbarPlacement(null);
      return;
    }
    const next = computeDockedToolbarPlacement(el);
    setToolbarPlacement(next);
  }, [isEditing]);

  const scheduleDockedToolbar = useCallback(() => {
    if (typeof window === 'undefined') return;
    cancelAnimationFrame(dockRafRef.current);
    dockRafRef.current = requestAnimationFrame(() => updateDockedToolbar());
  }, [updateDockedToolbar]);

  useLayoutEffect(() => {
    if (!isEditing) {
      setToolbarPlacement(null);
      return undefined;
    }
    updateDockedToolbar();
    const el = editableRef.current;
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(() => scheduleDockedToolbar()) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener('resize', scheduleDockedToolbar);
    window.addEventListener('scroll', scheduleDockedToolbar, true);
    return () => {
      window.removeEventListener('resize', scheduleDockedToolbar);
      window.removeEventListener('scroll', scheduleDockedToolbar, true);
      ro?.disconnect();
      cancelAnimationFrame(dockRafRef.current);
    };
  }, [isEditing, scheduleDockedToolbar, updateDockedToolbar]);

  useEffect(() => {
    if (!isEditing) {
      wasEditingRef.current = false;
      return;
    }
    if (!wasEditingRef.current) {
      wasEditingRef.current = true;
      const initial = sanitizeRichHtml(html || '<p></p>', sanitizeOptsPreview);
      snapshotRef.current = initial;
      lastCommittedRef.current = initial;
      requestAnimationFrame(() => {
        const el = editableRef.current;
        if (!el) return;
        el.innerHTML = initial;
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          el.focus();
        }
        el.focus();
        scheduleDockedToolbar();
      });
    }

    const el = editableRef.current;
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        if (el) el.innerHTML = snapshotRef.current;
        onCancel?.();
        wasEditingRef.current = false;
      }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        if (el) {
          const sanitized = sanitizeRichHtml(el.innerHTML, sanitizeOptsPersist);
          lastCommittedRef.current = sanitized;
          onCommit?.(sanitized);
        }
        wasEditingRef.current = false;
      }
    };
    if (el) el.addEventListener('keydown', onKeyDown);
    return () => {
      el?.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only hydrate when switching into edit mode; `html` is snapshotted once
  }, [isEditing, scheduleDockedToolbar]);

  useEffect(() => {
    if (!isEditing) setToolbarPlacement(null);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      wasEditingRef.current = false;
    }
  }, [isEditing]);

  const scheduleRuntimePersist = useCallback(() => {
    if (!onRuntimePersist || !editableRef.current) return;
    if (runtimePersistTimerRef.current) clearTimeout(runtimePersistTimerRef.current);
    runtimePersistTimerRef.current = setTimeout(() => {
      runtimePersistTimerRef.current = null;
      if (!editableRef.current) return;
      const sanitized = sanitizeRichHtml(editableRef.current.innerHTML, sanitizeOptsPersist);
      if (sanitized === lastCommittedRef.current) return;
      lastCommittedRef.current = sanitized;
      onRuntimePersist(sanitized);
    }, 350);
  }, [onRuntimePersist, sanitizeOptsPersist]);

  useEffect(
    () => () => {
      if (runtimePersistTimerRef.current) clearTimeout(runtimePersistTimerRef.current);
    },
    []
  );

  const handleBlur = () => {
    if (runtimePersistTimerRef.current) {
      clearTimeout(runtimePersistTimerRef.current);
      runtimePersistTimerRef.current = null;
    }
    if (!editableRef.current) return;
    const sanitized = sanitizeRichHtml(editableRef.current.innerHTML, sanitizeOptsPersist);
    if (sanitized === lastCommittedRef.current) return;
    lastCommittedRef.current = sanitized;
    onCommit?.(sanitized);
  };

  const applyHeading = (tag) => {
    exec('formatBlock', `<${tag}>`);
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const applyFontSize = (px) => {
    const n = `${px}px`;
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;

    exec('fontSize', '7');
    const fonts = editableRef.current?.querySelectorAll('font[size="7"]');
    fonts?.forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = n;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const applyColor = (hex) => {
    exec('foreColor', hex);
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const applyLetterSpacing = (px) => {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    try {
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      const span = document.createElement('span');
      span.style.letterSpacing = `${px}px`;
      range.surroundContents(span);
    } catch {
      exec('insertHTML', `<span style="letter-spacing:${px}px">${sel?.toString?.() || ''}</span>`);
    }
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const applyLink = () => {
    const url = typeof window !== 'undefined' ? window.prompt('Link URL', 'https://') : '';
    if (url === null) return;
    exec('createLink', url.trim() === '' ? false : url.trim());
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const applyAlign = (side) => {
    if (side === 'left') exec('justifyLeft');
    if (side === 'center') exec('justifyCenter');
    if (side === 'right') exec('justifyRight');
    editableRef.current?.focus();
    scheduleDockedToolbar();
    scheduleRuntimePersist();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text) return;
    exec('insertText', text);
    scheduleDockedToolbar();
  };

  if (isEditing) {
    return (
      <>
        <div
          ref={editableRef}
          className={`bld-rich-text bld-rich-text--editing ${className}`.trim()}
          style={style}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={() => {
            scheduleDockedToolbar();
            scheduleRuntimePersist();
          }}
          onKeyUp={() => {
            scheduleDockedToolbar();
            scheduleRuntimePersist();
          }}
          onMouseUp={scheduleDockedToolbar}
          onBlur={handleBlur}
          onPaste={handlePaste}
        />
        <DockedRichToolbar
          visible={Boolean(toolbarPlacement)}
          placement={toolbarPlacement}
          onHeading={applyHeading}
          onBold={() => {
            exec('bold');
            scheduleRuntimePersist();
          }}
          onItalic={() => {
            exec('italic');
            scheduleRuntimePersist();
          }}
          onUnderline={() => {
            exec('underline');
            scheduleRuntimePersist();
          }}
          onFontSize={applyFontSize}
          onLetterSpacing={applyLetterSpacing}
          onColor={applyColor}
          onLink={applyLink}
          onAlign={applyAlign}
        />
      </>
    );
  }

  return (
    <div
      className={`bld-rich-text ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: safePreview }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit?.();
      }}
      role="presentation"
    />
  );
}
