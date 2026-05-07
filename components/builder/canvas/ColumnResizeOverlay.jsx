'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function getColumnChildIds(node) {
  const kids = Array.isArray(node?.children) ? node.children : [];
  return kids.filter((c) => c?.nodeType === 'column').map((c) => c.id).filter(Boolean);
}

function pct(n) {
  return `${Math.round(n * 1000) / 10}%`;
}

function parseWidthPct(widthStr) {
  if (typeof widthStr !== 'string') return null;
  const raw = widthStr.trim();
  if (!raw.endsWith('%')) return null;
  const n = Number.parseFloat(raw.slice(0, -1));
  return Number.isFinite(n) ? n : null;
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const SNAP_TARGETS = [25, 33.33, 50, 66.66, 75];
function snapPct(value, threshold = 1.2) {
  let best = null;
  let bestDist = Infinity;
  for (const t of SNAP_TARGETS) {
    const d = Math.abs(value - t);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  if (best != null && bestDist <= threshold) return best;
  return value;
}

function equalizePcts(n) {
  if (n <= 0) return [];
  const each = 100 / n;
  return Array(n).fill(each);
}

function isNearEqual(pcts, eps = 1.0) {
  if (!Array.isArray(pcts) || pcts.length < 2) return false;
  const each = 100 / pcts.length;
  return pcts.every((p) => Math.abs(p - each) <= eps);
}

export default function ColumnResizeOverlay({
  rowNode,
  rowElement,
  deviceStyle,
  disabled = false,
  onPreviewColumnCss,
  onCommitColumnStyleJson,
  onClearPreview,
  applyDeviceStylePatch,
  withFlexWidthOverride,
  device,
  siteTheme,
}) {
  const colIds = useMemo(() => getColumnChildIds(rowNode), [rowNode]);
  const [handles, setHandles] = useState([]);
  const dragRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    if (!rowElement) return undefined;
    if (!colIds.length) return undefined;

    const compute = () => {
      const wrap = rowElement.querySelector(':scope > .bld-node-children');
      if (!wrap) {
        setHandles([]);
        return;
      }
      const colEls = colIds
        .map((id) => rowElement.querySelector(`[data-bld-node="${CSS.escape(id)}"]`))
        .filter(Boolean);
      if (colEls.length < 2) {
        setHandles([]);
        return;
      }
      const rowRect = rowElement.getBoundingClientRect();
      const next = [];
      for (let i = 0; i < colEls.length - 1; i += 1) {
        const a = colEls[i].getBoundingClientRect();
        const b = colEls[i + 1].getBoundingClientRect();
        const x = Math.round((a.right + b.left) / 2 - rowRect.left);
        next.push({ idx: i, left: x, top: 0, height: Math.round(rowRect.height) });
      }
      setHandles(next);
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(rowElement);
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [rowElement, colIds.join('|')]);

  const startDrag = (event, handleIdx) => {
    if (disabled) return;
    if (!rowElement) return;
    event.preventDefault();
    event.stopPropagation();

    const rowRect = rowElement.getBoundingClientRect();
    const startX = event.clientX;
    const width = Math.max(1, Math.round(rowRect.width));

    // Resolve current widths: prefer explicit pct widths, else split evenly.
    const explicit = colIds.map((id) => parseWidthPct(rowNode?.__deviceResolved?.[device]?.[id]?.size?.width)).filter(Boolean);
    const baseWidths = Array(colIds.length).fill(100 / colIds.length);

    const currentPct = colIds.map((colId, i) => {
      // Prefer computed style_json width from deviceStyle payload if provided by caller.
      const node = rowNode.children?.find((c) => c.id === colId);
      const w = node?.style_json?.[device]?.size?.width ?? node?.style_json?.desktop?.size?.width ?? node?.style_json?.size?.width;
      const p = parseWidthPct(w);
      return p != null ? p : baseWidths[i];
    });

    const minPct = 8;
    dragRef.current = { handleIdx, startX, width, startPct: currentPct, rowRect };
    setDragState({ active: true, handleIdx, pcts: currentPct, snapped: false });

    const onMove = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const deltaPct = (dx / dragRef.current.width) * 100;
      const idx = dragRef.current.handleIdx;

      const next = [...dragRef.current.startPct];
      const a = idx;
      const b = idx + 1;
      const a0 = next[a];
      const b0 = next[b];
      let a1 = clamp(a0 + deltaPct, minPct, 100 - minPct);
      let b1 = clamp(b0 - deltaPct, minPct, 100 - minPct);

      // Snap pair widths to common targets (keeps sum stable for the pair).
      const aSnap = snapPct(a1);
      const bSnap = snapPct(b1);
      const snapped = aSnap !== a1 || bSnap !== b1;
      a1 = aSnap;
      b1 = bSnap;

      next[a] = a1;
      next[b] = b1;

      // Normalize to sum 100 to avoid drift.
      const sum = next.reduce((acc, v) => acc + v, 0) || 100;
      const normalized = next.map((v) => (v / sum) * 100);
      setDragState({ active: true, handleIdx: idx, pcts: normalized, snapped });

      // Preview via CSS per column.
      for (let i = 0; i < colIds.length; i += 1) {
        const colId = colIds[i];
        const colNode = rowNode.children?.find((c) => c.id === colId);
        if (!colNode) continue;
        const patch = withFlexWidthOverride('column', { size: { width: pct(normalized[i]) } });
        const nextStyle = applyDeviceStylePatch(colNode.style_json, device, patch, 'column', siteTheme);
        onPreviewColumnCss?.(colId, nextStyle.previewCss);
      }
    };

    const onUp = async (e) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const st = dragRef.current;
      dragRef.current = null;
      if (!st) return;

      const dx = e.clientX - st.startX;
      const deltaPct = (dx / st.width) * 100;
      const idx = st.handleIdx;

      const next = [...st.startPct];
      const a = idx;
      const b = idx + 1;
      const a0 = next[a];
      const b0 = next[b];
      let a1 = clamp(a0 + deltaPct, minPct, 100 - minPct);
      let b1 = clamp(b0 - deltaPct, minPct, 100 - minPct);
      a1 = snapPct(a1);
      b1 = snapPct(b1);
      next[a] = a1;
      next[b] = b1;
      const sum = next.reduce((acc, v) => acc + v, 0) || 100;
      const normalized = next.map((v) => (v / sum) * 100);

      onClearPreview?.();
      setDragState(null);
      // Commit widths to style_json for this breakpoint only.
      for (let i = 0; i < colIds.length; i += 1) {
        const colId = colIds[i];
        const colNode = rowNode.children?.find((c) => c.id === colId);
        if (!colNode) continue;
        const patch = withFlexWidthOverride('column', { size: { width: pct(normalized[i]) } });
        const nextStyle = applyDeviceStylePatch(colNode.style_json, device, patch, 'column', siteTheme);
        // eslint-disable-next-line no-await-in-loop
        await onCommitColumnStyleJson?.(colId, nextStyle.style_json);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!rowElement || !handles.length) return null;

  return (
    <div className="bld-col-resize" aria-hidden>
      {dragState?.active ? (
        <div className="bld-col-resize__hud">
          <span className={`bld-col-resize__chip${dragState.snapped ? ' is-snap' : ''}`}>
            {dragState.pcts?.map((p) => `${Math.round(p * 10) / 10}%`).join(' · ')}
          </span>
          {!isNearEqual(dragState.pcts) ? (
            <button
              type="button"
              className="bld-col-resize__equal"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const eq = equalizePcts(colIds.length);
                setDragState((prev) => (prev ? { ...prev, pcts: eq } : prev));
                for (let i = 0; i < colIds.length; i += 1) {
                  const colId = colIds[i];
                  const colNode = rowNode.children?.find((c) => c.id === colId);
                  if (!colNode) continue;
                  const patch = withFlexWidthOverride('column', { size: { width: pct(eq[i]) } });
                  const nextStyle = applyDeviceStylePatch(colNode.style_json, device, patch, 'column', siteTheme);
                  onPreviewColumnCss?.(colId, nextStyle.previewCss);
                }
              }}
              title="Preview equal column widths"
            >
              Equal columns
            </button>
          ) : null}
        </div>
      ) : null}
      {handles.map((h) => (
        <button
          key={h.idx}
          type="button"
          className={`bld-col-resize__handle${dragState?.active && dragState.handleIdx === h.idx ? ' is-active' : ''}`}
          style={{ left: h.left, height: h.height }}
          onMouseDown={(e) => startDrag(e, h.idx)}
          disabled={disabled}
          title="Drag to resize columns"
        />
      ))}
    </div>
  );
}

