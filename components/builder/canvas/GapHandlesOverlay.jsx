'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function GapHandlesOverlay({
  containerNode,
  containerElement,
  deviceStyle,
  disabled = false,
  onPreviewCss,
  onCommitPatch,
  snapGapToScale,
  applyDeviceStylePatch,
  withFlexWidthOverride,
  device,
  siteTheme,
}) {
  const childIds = useMemo(() => {
    const kids = Array.isArray(containerNode?.children) ? containerNode.children : [];
    return kids.map((c) => c?.id).filter(Boolean);
  }, [containerNode]);
  const [handles, setHandles] = useState([]);
  const dragRef = useRef(null);
  const [hud, setHud] = useState(null);

  const flexDir = String(deviceStyle?.layout?.flexDirection || 'row');
  const axis = flexDir.startsWith('column') ? 'y' : 'x';

  useEffect(() => {
    if (!containerElement) return undefined;
    if (childIds.length < 2) return undefined;

    const compute = () => {
      const wrap = containerElement.querySelector(':scope > .bld-node-children');
      if (!wrap) {
        setHandles([]);
        return;
      }
      const kidEls = childIds
        .map((id) => containerElement.querySelector(`[data-bld-node="${CSS.escape(id)}"]`))
        .filter(Boolean);
      if (kidEls.length < 2) {
        setHandles([]);
        return;
      }
      const rect = containerElement.getBoundingClientRect();
      const next = [];
      for (let i = 0; i < kidEls.length - 1; i += 1) {
        const a = kidEls[i].getBoundingClientRect();
        const b = kidEls[i + 1].getBoundingClientRect();
        if (axis === 'x') {
          const x = Math.round((a.right + b.left) / 2 - rect.left);
          const y = Math.round(Math.min(a.top, b.top) - rect.top + 6);
          next.push({ idx: i, left: x, top: y });
        } else {
          const y = Math.round((a.bottom + b.top) / 2 - rect.top);
          const x = Math.round(Math.min(a.left, b.left) - rect.left + 6);
          next.push({ idx: i, left: x, top: y });
        }
      }
      setHandles(next);
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(containerElement);
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [containerElement, childIds.join('|'), axis]);

  const startDrag = (event) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const start = axis === 'x' ? event.clientX : event.clientY;
    const startGap = Number.parseFloat(String(deviceStyle?.layout?.gap ?? 0).replace('px', '')) || 0;
    dragRef.current = { start, startGap };
    setHud({ active: true, gap: startGap, gapScale: String(deviceStyle?.layout?.gapScale || ''), snapped: false });

    const onMove = (e) => {
      if (!dragRef.current) return;
      const cur = axis === 'x' ? e.clientX : e.clientY;
      const dx = cur - dragRef.current.start;
      const raw = clamp(Math.round(dragRef.current.startGap + dx), 0, 200);
      const snapped = snapGapToScale(raw, siteTheme);
      const patch = withFlexWidthOverride(containerNode.nodeType, {
        layout: { gap: snapped.gap, gapScale: snapped.gapScale },
      });
      const next = applyDeviceStylePatch(containerNode.style_json, device, patch, containerNode.nodeType, siteTheme);
      onPreviewCss?.(next.previewCss);
      setHud({ active: true, gap: snapped.gap, gapScale: snapped.gapScale, snapped: true });
    };

    const onUp = async (e) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const st = dragRef.current;
      dragRef.current = null;
      if (!st) return;
      const cur = axis === 'x' ? e.clientX : e.clientY;
      const dx = cur - st.start;
      const raw = clamp(Math.round(st.startGap + dx), 0, 200);
      const snapped = snapGapToScale(raw, siteTheme);
      onPreviewCss?.(null);
      setHud(null);
      await onCommitPatch?.({
        layout: { gap: snapped.gap, gapScale: snapped.gapScale },
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!containerElement || childIds.length < 2 || !handles.length) return null;
  if (!String(deviceStyle?.layout?.display || '').includes('flex')) return null;

  return (
    <div className="bld-gap-handles" aria-hidden>
      {hud?.active ? (
        <div className="bld-gap-handles__hud">
          <span className={`bld-gap-handles__chip${hud.snapped ? ' is-snap' : ''}`}>
            Gap: {Math.round(hud.gap)}px{hud.gapScale ? ` (${hud.gapScale})` : ''}
          </span>
        </div>
      ) : null}
      {handles.map((h) => (
        <button
          key={h.idx}
          type="button"
          className={`bld-gap-handles__handle${hud?.active ? ' is-active' : ''}`}
          style={{ left: h.left, top: h.top }}
          onMouseDown={startDrag}
          disabled={disabled}
          title="Drag to change gap"
        />
      ))}
    </div>
  );
}

