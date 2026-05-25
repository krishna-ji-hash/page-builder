'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SIDES = ['top', 'right', 'bottom', 'left'];

function parseNum(v) {
  if (v === '' || v == null) return NaN;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? '').replace('px', '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function boxSidesAllEmpty(box) {
  return SIDES.every((s) => {
    const v = box[s];
    return v === '' || v == null || (typeof v === 'string' && !String(v).trim());
  });
}

function boxToCssString(box, clampFn) {
  const q = (side) => {
    const raw = box[side];
    if (raw === '' || raw == null) return clampFn(0);
    const n = parseNum(raw);
    return clampFn(Number.isFinite(n) ? n : 0);
  };
  const t = q('top');
  const r = q('right');
  const b = q('bottom');
  const l = q('left');
  return `${t}px ${r}px ${b}px ${l}px`;
}

function clampMargin(v) {
  const n = Math.round(typeof v === 'number' && Number.isFinite(v) ? v : parseNum(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(-48, Math.min(240, n));
}

function clampPadding(v) {
  const n = Math.round(typeof v === 'number' && Number.isFinite(v) ? v : parseNum(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(240, n));
}

function SideInput({ label, value, onChange, onFocus, onBlur, onHover, onLeave, onDragDelta, disabled }) {
  const startRef = useRef(null);
  const display = value === '' || value == null ? '' : String(value);
  return (
    <div className="bld-boxmodel__cell">
      <label className="bld-boxmodel__side">{label}</label>
      <input
        className="bld-input bld-boxmodel__input"
        value={display}
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
  const editSnapshotRef = useRef(null);
  const onPreviewRef = useRef(onPreviewStylePatch);
  onPreviewRef.current = onPreviewStylePatch;

  const patchForBox = useMemo(() => {
    const key = kind === 'padding' ? 'padding' : 'margin';
    if (boxSidesAllEmpty(box)) {
      return { spacing: { [key]: null } };
    }
    const value = boxToCssString(box, clamp);
    return { spacing: { [key]: value } };
  }, [box, kind, clamp]);

  useEffect(() => {
    if (!isEditing) return;
    onPreviewRef.current?.(patchForBox);
  }, [isEditing, patchForBox]);

  const setSide = (side, nextVal) => {
    if (nextVal === '' || (typeof nextVal === 'string' && !String(nextVal).trim())) {
      setBox((prev) => {
        const next = { ...(prev || {}) };
        if (linked) {
          for (const s of SIDES) next[s] = '';
        } else {
          next[side] = '';
        }
        return next;
      });
      return;
    }
    const n = parseNum(nextVal);
    if (!Number.isFinite(n)) return;
    const v = clamp(n);
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
    editSnapshotRef.current = { ...box };
    setIsEditing(true);
    if (selectedNodeId) {
      onActiveSpacingEdit?.({ nodeId: selectedNodeId, kind, side });
    }
  };

  const end = async () => {
    const snap = editSnapshotRef.current;
    editSnapshotRef.current = null;
    setIsEditing(false);
    onActiveSpacingEdit?.(null);
    onClearPreviewStyle?.();

    if (!snap) return;

    const unchanged = SIDES.every((s) => {
      const a = snap[s];
      const b = box[s];
      const as = a === '' || a == null ? '' : String(a);
      const bs = b === '' || b == null ? '' : String(b);
      return as === bs;
    });
    if (unchanged) return;

    await onCommitStylePatch?.(patchForBox, box);
  };

  const hover = (side) => {
    if (!selectedNodeId) return;
    onActiveSpacingEdit?.({ nodeId: selectedNodeId, kind, side });
  };

  const leave = () => {
    if (isEditing) return;
    onActiveSpacingEdit?.(null);
  };

  const dragBase = (side) => {
    const raw = box[side];
    const n = parseNum(raw);
    return Number.isFinite(n) ? n : 0;
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
          title={
            linked
              ? 'Linked: editing one side updates all four — click to edit each side separately'
              : 'Unlinked: each side is independent — click to tie all sides to the same value'
          }
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
          onDragDelta={(d) => setSide('top', dragBase('top') + d)}
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
          onDragDelta={(d) => setSide('right', dragBase('right') + d)}
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
          onDragDelta={(d) => setSide('bottom', dragBase('bottom') + d)}
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
          onDragDelta={(d) => setSide('left', dragBase('left') + d)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function formSide(form, prefix, side) {
  const key = `${prefix}${side[0].toUpperCase()}${side.slice(1)}`;
  const v = form[key];
  if (v === '' || v == null) return '';
  return prefix === 'padding' ? clampPadding(v) : clampMargin(v);
}

export default function SpacingControls({
  form,
  onUpdate,
  onPatchForm,
  onPreviewStylePatch,
  onCommitStylePatch,
  onClearPreviewStyle,
  onActiveSpacingEdit,
  selectedNodeId,
}) {
  const [padBox, setPadBox] = useState({ top: '', right: '', bottom: '', left: '' });
  const [marBox, setMarBox] = useState({ top: '', right: '', bottom: '', left: '' });
  /** Default off: changing T/R/B/L only updates that side unless user turns Linked on. */
  const [padLinked, setPadLinked] = useState(false);
  const [marLinked, setMarLinked] = useState(false);

  useEffect(() => {
    setPadBox({
      top: formSide(form, 'padding', 'top'),
      right: formSide(form, 'padding', 'right'),
      bottom: formSide(form, 'padding', 'bottom'),
      left: formSide(form, 'padding', 'left'),
    });
    setMarBox({
      top: formSide(form, 'margin', 'top'),
      right: formSide(form, 'margin', 'right'),
      bottom: formSide(form, 'margin', 'bottom'),
      left: formSide(form, 'margin', 'left'),
    });
  }, [
    selectedNodeId,
    form.paddingTop,
    form.paddingRight,
    form.paddingBottom,
    form.paddingLeft,
    form.marginTop,
    form.marginRight,
    form.marginBottom,
    form.marginLeft,
  ]);

  const syncFormFromBox = (kind, box) => {
    const patch =
      kind === 'padding'
        ? {
            paddingTop: box.top,
            paddingRight: box.right,
            paddingBottom: box.bottom,
            paddingLeft: box.left,
          }
        : {
            marginTop: box.top,
            marginRight: box.right,
            marginBottom: box.bottom,
            marginLeft: box.left,
          };
    if (typeof onPatchForm === 'function') {
      onPatchForm(patch);
      return;
    }
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
        Tip: drag inside a value field to nudge. Shift = faster. Hover shows guides on canvas. Changes commit on blur. Turn{' '}
        <strong>Linked</strong> on only if you want one value to apply to all four sides.
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
        onPreviewStylePatch={onPreviewStylePatch}
        onCommitStylePatch={async (p, committedBox) => {
          syncFormFromBox('margin', committedBox);
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
        onPreviewStylePatch={onPreviewStylePatch}
        onCommitStylePatch={async (p, committedBox) => {
          syncFormFromBox('padding', committedBox);
          await onCommitStylePatch?.(p);
        }}
        onClearPreviewStyle={onClearPreviewStyle}
        onActiveSpacingEdit={onActiveSpacingEdit}
        disabled={!selectedNodeId}
      />
    </div>
  );
}
