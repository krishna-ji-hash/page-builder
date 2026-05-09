'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

function severityColor(sev) {
  if (sev === 'critical') return '#b91c1c';
  if (sev === 'warning') return '#b45309';
  return '#2563eb';
}

function uniqueByNode(issues) {
  const best = new Map();
  const rank = { critical: 3, warning: 2, suggestion: 1 };
  for (const w of issues || []) {
    const id = w?.nodeId;
    if (!id) continue;
    const cur = best.get(id);
    if (!cur) {
      best.set(id, w);
      continue;
    }
    const a = rank[w.severity] || 0;
    const b = rank[cur.severity] || 0;
    if (a > b) best.set(id, w);
  }
  return Array.from(best.values());
}

function groupCounts(issues) {
  const byNode = new Map();
  for (const w of issues || []) {
    const id = w?.nodeId;
    if (!id) continue;
    const cur = byNode.get(id) || { critical: 0, warning: 0, suggestion: 0, top: null };
    if (w.severity === 'critical') cur.critical += 1;
    else if (w.severity === 'warning') cur.warning += 1;
    else cur.suggestion += 1;
    // keep top severity issue for tooltip
    const rank = { critical: 3, warning: 2, suggestion: 1 };
    if (!cur.top || (rank[w.severity] || 0) > (rank[cur.top.severity] || 0)) cur.top = w;
    byNode.set(id, cur);
  }
  return Array.from(byNode.entries()).map(([nodeId, v]) => ({ nodeId, ...v }));
}

export default function AuditBadgesOverlay({ open, issues = [], onClickNode }) {
  const [positions, setPositions] = useState([]);

  const nodeIssues = useMemo(() => groupCounts(issues), [issues]);

  useEffect(() => {
    if (!open) {
      setPositions([]);
      return;
    }
    const root =
      document.querySelector('.bld-canvas__live-mirror .live-doc') ||
      document.querySelector('.bld-canvas__live-mirror') ||
      document.querySelector('.bld-canvas__page');
    if (!root) return;

    const compute = () => {
      const rootRect = root.getBoundingClientRect();
      const out = [];
      for (const w of nodeIssues) {
        const el = root.querySelector(`[data-bld-node="${CSS.escape(String(w.nodeId))}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        out.push({
          nodeId: w.nodeId,
          severity: w.top?.severity || 'suggestion',
          label: w.top?.label || '',
          critical: w.critical,
          warning: w.warning,
          suggestion: w.suggestion,
          x: Math.max(0, r.left - rootRect.left),
          y: Math.max(0, r.top - rootRect.top),
        });
      }
      setPositions(out);
    };

    const raf = () => window.requestAnimationFrame(() => compute());
    compute();

    const ro = new ResizeObserver(raf);
    ro.observe(root);
    window.addEventListener('scroll', raf, true);
    window.addEventListener('resize', raf);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', raf, true);
      window.removeEventListener('resize', raf);
    };
  }, [open, nodeIssues]);

  if (!open) return null;

  const root =
    typeof document !== 'undefined'
      ? document.querySelector('.bld-canvas__live-mirror')
      : null;
  if (!root) return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {positions.map((p) => (
        <div
          key={`${p.nodeId}-${p.severity}`}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            transform: 'translate(-10px, -10px)',
            background: severityColor(p.severity),
            color: 'white',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 900,
            padding: '2px 6px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          title={`${p.label || ''} (C${p.critical}/W${p.warning}/S${p.suggestion})`}
          role="button"
          tabIndex={-1}
          onClick={() => onClickNode?.(p.nodeId)}
        >
          {p.severity.toUpperCase()} {p.critical + p.warning + p.suggestion}
        </div>
      ))}
    </div>,
    root
  );
}

