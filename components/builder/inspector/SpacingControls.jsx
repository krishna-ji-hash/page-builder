'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIDES = ['top', 'right', 'bottom', 'left'];

function parseNum(v) {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? '').replace('px', '').trim());
  return Number.isFinite(n) ? n : 0;
}

function boxToCssString(box) {
  const t = Math.max(0, Math.round(parseNum(box.top)));
  const r = Math.max(0, Math.round(parseNum(box.right)));
  const b = Math.max(0, Math.round(parseNum(box.bottom)));
  const l = Math.max(0, Math.round(parseNum(box.left)));
  return `${t}px ${r}px ${b}px ${l}px`;
}

function clampMargin(v) {
  const n = Math.round(parseNum(v));
  // Guardrail: avoid huge negative collapses; still allow modest negatives for advanced layouts.
  return Math.max(-48, Math.min(240, n));
}

function clampPadding(v) {
  const n = Math.round(parseNum(v));
  return Math.max(0, Math.min(240, n));
}

function SideInput({ label, value, onChange, onFocus, onBlur, onHover, onLeave, onDragDelta, disabled }) {
  const startRef = useRef(null);
  return (
    <div className="bld-boxmodel__cell">
      <label className="bld-boxmodel__side">{label}</label>
      <input
        className="bld-input bld-boxmodel__input"
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        disabled={disabled}
        onMouseDown={(e) => {
          if (disabled) return;
          if (e.button !== 0) return;
          startRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!startRef.current) return;
          const dx = e.clientX - startRef.current.x;
          const dy = e.clientY - startRef.current.y;
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
          const step = e.shiftKey ? 10 : 1;
          const snapped = Math.round(delta / 6) * step;
          if (snapped) {
            startRef.current = { x: e.clientX, y: e.clientY };
            onDragDelta(snapped);
          }
        }}
        onMouseUp={() => {
          startRef.current = null;
        }}
      />
    </div>
  );
}

function BoxModelVisual({
  title,
  kind,
  box,
  setBox,
  linked,
  setLinked,
  clamp,
  selectedNodeId,
  onPreviewStylePatch,
  onCommitStylePatch,
  onClearPreviewStyle,
  onActiveSpacingEdit,
  disabled,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const patchForBox = useMemo(() => {
    const value = boxToCssString(box);
    return kind === 'padding'
      ? { spacing: { padding: value } }
      : { spacing: { margin: value } };
  }, [box, kind]);

  useEffect(() => {
    if (!isEditing) return;
    onPreviewStylePatch?.(patchForBox);
  }, [isEditing, patchForBox, onPreviewStylePatch]);

  const setSide = (side, nextVal) => {
    const v = clamp(nextVal);
    setBox((prev) => {
      const next = { ...(prev || {}) };
      if (linked) {
        for (const s of SIDES) next[s] = v;
      } else {
        next[side] = v;
      }
      return next;
    });
  };

  const begin = (side) => {
    setIsEditing(true);
    if (selectedNodeId) {
      onActiveSpacingEdit?.({ nodeId: selectedNodeId, kind, side });
    }
  };

  const end = async () => {
    setIsEditing(false);
    onActiveSpacingEdit?.(null);
    onClearPreviewStyle?.();
    await onCommitStylePatch?.(patchForBox);
  };

  const hover = (side) => {
    if (!selectedNodeId) return;
    onActiveSpacingEdit?.({ nodeId: selectedNodeId, kind, side });
  };

  const leave = () => {
    if (isEditing) return;
    onActiveSpacingEdit?.(null);
  };

  return (
    <div className="bld-boxmodel">
      <div className="bld-boxmodel__head">
        <div className="bld-boxmodel__title">{title}</div>
        <button
          type="button"
          className={`bld-boxmodel__link ${linked ? 'is-on' : ''}`}
          onClick={() => setLinked((p) => !p)}
          disabled={disabled}
          title={linked ? 'Linked' : 'Unlinked'}
        >
          {linked ? 'Linked' : 'Unlinked'}
        </button>
      </div>
      <div className={`bld-boxmodel__grid bld-boxmodel__grid--${kind}`}>
        <SideInput
          label="T"
          value={box.top}
          onChange={(v) => setSide('top', v)}
          onFocus={() => begin('top')}
          onBlur={end}
          onHover={() => hover('top')}
          onLeave={leave}
          onDragDelta={(d) => setSide('top', parseNum(box.top) + d)}
          disabled={disabled}
        />
        <SideInput
          label="R"
          value={box.right}
          onChange={(v) => setSide('right', v)}
          onFocus={() => begin('right')}
          onBlur={end}
          onHover={() => hover('right')}
          onLeave={leave}
          onDragDelta={(d) => setSide('right', parseNum(box.right) + d)}
          disabled={disabled}
        />
        <SideInput
          label="B"
          value={box.bottom}
          onChange={(v) => setSide('bottom', v)}
          onFocus={() => begin('bottom')}
          onBlur={end}
          onHover={() => hover('bottom')}
          onLeave={leave}
          onDragDelta={(d) => setSide('bottom', parseNum(box.bottom) + d)}
          disabled={disabled}
        />
        <SideInput
          label="L"
          value={box.left}
          onChange={(v) => setSide('left', v)}
          onFocus={() => begin('left')}
          onBlur={end}
          onHover={() => hover('left')}
          onLeave={leave}
          onDragDelta={(d) => setSide('left', parseNum(box.left) + d)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function SpacingControls({
  form,
  onUpdate,
  onPreviewStylePatch,
  onCommitStylePatch,
  onClearPreviewStyle,
  onActiveSpacingEdit,
  selectedNodeId,
}) {
  const [padBox, setPadBox] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [marBox, setMarBox] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [padLinked, setPadLinked] = useState(true);
  const [marLinked, setMarLinked] = useState(true);

  useEffect(() => {
    setPadBox({
      top: clampPadding(form.paddingTop),
      right: clampPadding(form.paddingRight),
      bottom: clampPadding(form.paddingBottom),
      left: clampPadding(form.paddingLeft),
    });
    setMarBox({
      top: clampMargin(form.marginTop),
      right: clampMargin(form.marginRight),
      bottom: clampMargin(form.marginBottom),
      left: clampMargin(form.marginLeft),
    });
  }, [
    form.paddingTop,
    form.paddingRight,
    form.paddingBottom,
    form.paddingLeft,
    form.marginTop,
    form.marginRight,
    form.marginBottom,
    form.marginLeft,
  ]);

  // Keep the legacy numeric fields in sync when we commit (so existing UI stays consistent).
  const syncFormFromBox = (kind, box) => {
    if (kind === 'padding') {
      onUpdate?.('paddingTop', box.top);
      onUpdate?.('paddingRight', box.right);
      onUpdate?.('paddingBottom', box.bottom);
      onUpdate?.('paddingLeft', box.left);
    } else {
      onUpdate?.('marginTop', box.top);
      onUpdate?.('marginRight', box.right);
      onUpdate?.('marginBottom', box.bottom);
      onUpdate?.('marginLeft', box.left);
    }
  };

  return (
    <div className="bld-control-stack">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Tip: drag inside a value field to nudge. Shift = faster. Hover shows guides on canvas. Changes commit on blur.
      </p>
      <BoxModelVisual
        title="Margin"
        kind="margin"
        box={marBox}
        setBox={(updater) => {
          setMarBox((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            return next;
          });
        }}
        linked={marLinked}
        setLinked={setMarLinked}
        clamp={clampMargin}
        selectedNodeId={selectedNodeId}
        onPreviewStylePatch={(p) => onPreviewStylePatch?.(p)}
        onCommitStylePatch={async (p) => {
          syncFormFromBox('margin', marBox);
          await onCommitStylePatch?.(p);
        }}
        onClearPreviewStyle={onClearPreviewStyle}
        onActiveSpacingEdit={onActiveSpacingEdit}
        disabled={!selectedNodeId}
      />
      <BoxModelVisual
        title="Padding"
        kind="padding"
        box={padBox}
        setBox={(updater) => {
          setPadBox((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            return next;
          });
        }}
        linked={padLinked}
        setLinked={setPadLinked}
        clamp={clampPadding}
        selectedNodeId={selectedNodeId}
        onPreviewStylePatch={(p) => onPreviewStylePatch?.(p)}
        onCommitStylePatch={async (p) => {
          syncFormFromBox('padding', padBox);
          await onCommitStylePatch?.(p);
        }}
        onClearPreviewStyle={onClearPreviewStyle}
        onActiveSpacingEdit={onActiveSpacingEdit}
        disabled={!selectedNodeId}
      />
    </div>
  );
}
