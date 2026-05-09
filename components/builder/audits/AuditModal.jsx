'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildOptimizationSuggestions, runTreeAudits, scoreFromWarnings } from '@/lib/audits/auditEngine';
import { findNodeInTree } from '@/lib/builderTree';

function safeNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function classifyOverflow(el, rootRect) {
  const rect = el.getBoundingClientRect();
  const outsideX = rect.left < rootRect.left - 0.5 || rect.right > rootRect.right + 0.5;
  const outsideY = rect.top < rootRect.top - 0.5 || rect.bottom > rootRect.bottom + 0.5;
  return { rect, outsideX, outsideY };
}

function parsePx(v) {
  const n = parseFloat(String(v || '').replace('px', '').trim());
  return Number.isFinite(n) ? n : 0;
}

function treeNodeType(tree, nodeId) {
  const n = findNodeInTree(Array.isArray(tree) ? tree : [], Number(nodeId));
  return n?.nodeType || null;
}

function computeDomAudits({ device, mediaMetaByUrl, tree }) {
  const warnings = [];

  const root = document.querySelector('.bld-canvas__live-mirror .live-doc') || document.querySelector('.bld-canvas__live-mirror') || document.querySelector('.bld-canvas__page');
  if (!root) return { warnings };

  const rootRect = root.getBoundingClientRect();
  const nodeEls = [...root.querySelectorAll('[data-bld-node]')];

  // Responsive: horizontal overflow — mapped fixes (nowrap wrap → stack mobile → font → width 100%)
  for (const el of nodeEls) {
    const nodeId = el.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const { outsideX } = classifyOverflow(el, rootRect);
    if (!outsideX) continue;
    const cs = window.getComputedStyle(el);
    const disp = cs.display;
    const isFlex = disp === 'flex' || disp === 'inline-flex';
    const flexWrap = cs.flexWrap || 'nowrap';
    const flexDir = cs.flexDirection || 'row';

    if (isFlex && flexWrap === 'nowrap') {
      warnings.push({
        id: `resp-flex-nowrap-overflow-${nodeId}`,
        severity: device === 'mobile' ? 'critical' : 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Flex row with nowrap may overflow horizontally',
        quickFix: {
          label: 'Enable wrap',
          type: 'enableWrap',
          device,
        },
      });
      continue;
    }
    if (device === 'mobile' && isFlex && (flexDir === 'row' || flexDir === 'row-reverse')) {
      warnings.push({
        id: `resp-mobile-row-overflow-${nodeId}`,
        severity: 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Row layout overflows viewport on mobile',
        quickFix: {
          label: 'Stack on mobile',
          type: 'stackMobile',
        },
      });
      continue;
    }
    if (device === 'mobile') {
      const fs = parsePx(cs.fontSize);
      if (fs >= 18) {
        warnings.push({
          id: `resp-font-large-overflow-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Large type on mobile may worsen overflow (${fs}px)`,
          quickFix: {
            label: 'Reduce font on mobile',
            type: 'reduceFontMobile',
            valuePx: Math.max(14, Math.round(fs - 4)),
          },
        });
        continue;
      }
    }
    warnings.push({
      id: `resp-outside-x-${nodeId}`,
      severity: device === 'mobile' ? 'critical' : 'warning',
      kind: 'responsive',
      nodeId: Number(nodeId),
      label: 'Element extends beyond viewport (horizontal overflow)',
      quickFix: {
        label: 'Set width 100%',
        type: 'width100',
        device,
      },
    });
  }

  // Clipped content: overflow hidden + scrollWidth larger than clientWidth
  for (const el of nodeEls) {
    const nodeId = el.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const cs = window.getComputedStyle(el);
    const overflowX = cs.overflowX;
    if ((overflowX === 'hidden' || overflowX === 'clip') && el.scrollWidth > el.clientWidth + 2) {
      warnings.push({
        id: `resp-clipped-${nodeId}`,
        severity: 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Content may be clipped (overflow hidden/clip with scrollWidth > clientWidth)',
      });
    }
  }

  // Tap targets: buttons/links/inputs smaller than 44px
  const tappables = [...root.querySelectorAll('button,a,input,select,textarea,[role="button"]')];
  for (const el of tappables) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    if (rect.width >= 44 && rect.height >= 44) continue;
    const host = el.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    warnings.push({
      id: `a11y-tap-${nodeId}-${Math.round(rect.width)}x${Math.round(rect.height)}`,
      severity: 'suggestion',
      kind: 'a11y',
      nodeId: Number(nodeId),
      label: `Tiny tap target (${Math.round(rect.width)}×${Math.round(rect.height)}px)`,
    });
  }

  // Unreadable font sizes on mobile (< 12px)
  if (device === 'mobile') {
    for (const el of nodeEls) {
      const nodeId = el.getAttribute('data-bld-node');
      if (!nodeId) continue;
      const cs = window.getComputedStyle(el);
      const fs = parsePx(cs.fontSize);
      if (fs > 0 && fs < 12) {
        warnings.push({
          id: `resp-font-small-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Unreadable font size on mobile (${fs.toFixed(1)}px)`,
          quickFix: {
            label: 'Improve readability (mobile font)',
            type: 'reduceFontMobile',
            valuePx: 14,
          },
        });
      }
    }
  }

  // Oversized gaps/padding on mobile
  if (device === 'mobile') {
    for (const el of nodeEls) {
      const nodeId = el.getAttribute('data-bld-node');
      if (!nodeId) continue;
      const cs = window.getComputedStyle(el);
      const gap = parsePx(cs.gap);
      const padL = parsePx(cs.paddingLeft);
      const padR = parsePx(cs.paddingRight);
      const ml = parsePx(cs.marginLeft);
      const mr = parsePx(cs.marginRight);
      if (ml + mr >= rootRect.width * 0.22) {
        warnings.push({
          id: `resp-margin-large-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: 'Large horizontal margin on mobile',
          quickFix: {
            label: 'Reduce margin',
            type: 'reduceMargin',
            device: 'mobile',
            valuePx: 8,
          },
        });
      }
      if (gap >= 40) {
        warnings.push({
          id: `perf-gap-big-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Large gap on mobile (${gap}px)`,
          quickFix: {
            label: 'Reduce gap',
            type: 'reduceGap',
            device: 'mobile',
            valuePx: 16,
          },
        });
      }
      if (padL + padR >= rootRect.width * 0.4) {
        warnings.push({
          id: `resp-pad-big-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: 'Large horizontal padding on mobile',
          quickFix: {
            label: 'Reduce padding',
            type: 'reducePadding',
            device: 'mobile',
            valuePx: Math.max(12, Math.round((padL + padR) / 6) || 16),
          },
        });
      }
    }
  }

  // CLS risk: images without reserved height (very heuristic)
  const imgs = [...root.querySelectorAll('img')];
  for (const img of imgs) {
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const host = img.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const src = String(img.currentSrc || img.src || '');
    let meta = null;
    if (mediaMetaByUrl && src) {
      let pathKey = '';
      try {
        pathKey = new URL(src, window.location.href).pathname;
      } catch {
        pathKey = '';
      }
      meta = mediaMetaByUrl.get(src) || (pathKey ? mediaMetaByUrl.get(pathKey) : null) || null;
    }
    if (!img.getAttribute('width') && !img.getAttribute('height')) {
      const clsBase = {
        id: `cls-img-dims-${nodeId}`,
        severity: 'suggestion',
        kind: 'cls',
        nodeId: Number(nodeId),
        label: 'Image missing explicit width/height attributes (CLS risk)',
      };
      if (meta?.width && meta?.height) {
        warnings.push({
          ...clsBase,
          quickFix: {
            label: 'Apply aspect ratio from metadata',
            type: 'applyAspectRatio',
            device: 'desktop',
            width: meta.width,
            height: meta.height,
          },
        });
      } else {
        warnings.push({
          ...clsBase,
          fixUnavailableReason: 'No width/height in media metadata for this URL.',
        });
      }
    }
    if (meta?.bytes && meta.bytes > 1_500_000) {
      warnings.push({
        id: `perf-img-large-${nodeId}`,
        severity: meta.bytes > 3_000_000 ? 'warning' : 'suggestion',
        kind: 'performance',
        nodeId: Number(nodeId),
        label: `Large image file (${Math.round(meta.bytes / 1024)} KB)`,
      });
    }
    if (meta?.width && meta?.height) {
      const rw = rect.width;
      const rh = rect.height;
      if (rw > 0 && rh > 0 && (meta.width > rw * 2 || meta.height > rh * 2)) {
        warnings.push({
          id: `perf-img-oversized-dims-${nodeId}`,
          severity: 'suggestion',
          kind: 'performance',
          nodeId: Number(nodeId),
          label: `Image dimensions larger than rendered (${meta.width}×${meta.height} vs ~${Math.round(rw)}×${Math.round(rh)})`,
        });
      }
    }
    if (
      meta?.mimeType &&
      !String(meta.mimeType).includes('webp') &&
      !String(meta.mimeType).includes('avif') &&
      meta?.bytes > 800_000
    ) {
      warnings.push({
        id: `perf-img-modern-${nodeId}`,
        severity: 'suggestion',
        kind: 'performance',
        nodeId: Number(nodeId),
        label: 'Consider modern image format (webp/avif)',
      });
    }
  }

  // Carousel: scroll overflow + unstable height (heuristics)
  const carouselHosts = [...root.querySelectorAll('[data-bld-node]')].filter((el) => {
    // runtime carousel tends to include class 'live-carousel' but we stay generic: check for descendants with aria-roledescription or known classes
    return el.querySelector('.live-carousel') || el.querySelector('[data-carousel]') || el.querySelector('.live-carousel__track');
  });
  for (const host of carouselHosts) {
    const nodeId = host.getAttribute('data-bld-node');
    if (!nodeId) continue;
    if (host.scrollWidth > host.clientWidth + 2) {
      const nType = treeNodeType(tree, nodeId);
      const row = {
        id: `resp-carousel-overflow-${nodeId}`,
        severity: device === 'mobile' ? 'warning' : 'suggestion',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Carousel may overflow horizontally',
      };
      if (nType === 'carousel') {
        row.quickFix = {
          label: 'Set mobile slidesPerView = 1',
          type: 'reduceSlidesPerViewMobile',
        };
      } else {
        row.fixUnavailableReason = 'Quick-fix applies to carousel nodes only.';
      }
      warnings.push(row);
    }
    const h = host.getBoundingClientRect().height;
    if (h < 120) {
      warnings.push({
        id: `cls-carousel-height-${nodeId}`,
        severity: 'suggestion',
        kind: 'cls',
        nodeId: Number(nodeId),
        label: 'Carousel height is small/unstable risk (consider fixed height/aspect)',
        quickFix: {
          label: 'Set minimum height',
          type: 'setMinHeightCls',
          valuePx: 240,
          device,
        },
      });
    }
  }

  // Contrast risk (computed, heuristic)
  const textEls = [...root.querySelectorAll('h1,h2,h3,p,button,a,span')];
  const parseRgb = (c) => {
    const m = String(c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  };
  const lum = (rgb) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
  };
  const contrastRatio = (fg, bg) => {
    const L1 = lum(fg);
    const L2 = lum(bg);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const el of textEls) {
    const host = el.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const cs = window.getComputedStyle(el);
    const fg = parseRgb(cs.color);
    if (!fg) continue;
    // Find a non-transparent background up the tree (best effort)
    let bg = null;
    let cur = el;
    for (let i = 0; i < 6 && cur; i += 1) {
      const ccs = window.getComputedStyle(cur);
      const b = parseRgb(ccs.backgroundColor);
      if (b && !String(ccs.backgroundColor).includes('rgba(0, 0, 0, 0)') && ccs.backgroundColor !== 'transparent') {
        bg = b;
        break;
      }
      cur = cur.parentElement;
    }
    if (!bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      warnings.push({
        id: `a11y-contrast-${nodeId}-${Math.round(ratio * 10)}`,
        severity: ratio < 3 ? 'warning' : 'suggestion',
        kind: 'a11y',
        nodeId: Number(nodeId),
        label: `Low contrast risk (ratio ${ratio.toFixed(2)})`,
      });
    }
  }

  // Shadow / filter / animation density (computed styles)
  let shadowCount = 0;
  let filterCount = 0;
  let animatedCount = 0;
  let hoverMotionCount = 0;
  for (const el of nodeEls) {
    const cs = window.getComputedStyle(el);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadowCount += 1;
    if (cs.filter && cs.filter !== 'none') filterCount += 1;
    if (cs.animationName && cs.animationName !== 'none') animatedCount += 1;
    const tp = String(cs.transitionProperty || '');
    if (tp.includes('transform')) hoverMotionCount += 1;
  }
  if (shadowCount > 40) {
    warnings.push({
      id: `perf-shadow-density`,
      severity: shadowCount > 80 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many elements with box-shadow (${shadowCount})`,
    });
  }
  if (filterCount > 20) {
    warnings.push({
      id: `perf-filter-density`,
      severity: filterCount > 40 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many elements using CSS filters (${filterCount})`,
    });
  }
  if (animatedCount > 18) {
    warnings.push({
      id: `perf-animation-density`,
      severity: animatedCount > 40 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many animated elements (${animatedCount})`,
    });
  }
  if (hoverMotionCount > 60) {
    warnings.push({
      id: `perf-hover-motion-density`,
      severity: 'suggestion',
      kind: 'performance',
      label: `Many elements transition transform (${hoverMotionCount})`,
    });
  }

  return { warnings };
}

function Section({ title, children }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AuditModal({
  open,
  pageId,
  device,
  projectConfig,
  pageSeo,
  tree,
  mediaMetaByUrl,
  onClose,
  onSelectNode,
  onQuickFix,
  onReportChange,
}) {
  const [domWarnings, setDomWarnings] = useState([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [fixedFlashById, setFixedFlashById] = useState({});
  const roRef = useRef(null);

  const treeResult = useMemo(() => runTreeAudits({ tree, pageSeo, projectConfig }), [tree, pageSeo, projectConfig]);
  const allWarnings = useMemo(() => [...(treeResult.warnings || []), ...(domWarnings || [])], [treeResult.warnings, domWarnings]);

  const scores = useMemo(() => {
    const byKind = { responsive: [], a11y: [], performance: [], cls: [], seo: [] };
    for (const w of allWarnings) {
      const k = w.kind || 'responsive';
      if (!byKind[k]) byKind[k] = [];
      byKind[k].push(w);
    }
    return {
      responsive: scoreFromWarnings(byKind.responsive),
      accessibility: scoreFromWarnings(byKind.a11y),
      performance: scoreFromWarnings(byKind.performance),
      cls: scoreFromWarnings(byKind.cls),
      seo: scoreFromWarnings(byKind.seo),
    };
  }, [allWarnings]);

  const summaryCounts = useMemo(() => {
    const out = { total: allWarnings.length, critical: 0, warning: 0, suggestion: 0 };
    for (const w of allWarnings) {
      if (w.severity === 'critical') out.critical += 1;
      else if (w.severity === 'warning') out.warning += 1;
      else out.suggestion += 1;
    }
    return out;
  }, [allWarnings]);

  const report = useMemo(() => {
    return {
      pageId,
      device,
      scores,
      counts: summaryCounts,
      issues: allWarnings.map((w) => ({
        id: w.id,
        kind: w.kind,
        severity: w.severity,
        label: w.label,
        nodeId: w.nodeId ?? null,
      })),
    };
  }, [allWarnings, device, pageId, scores, summaryCounts]);

  const suggestions = useMemo(() => buildOptimizationSuggestions(report.issues || []), [report.issues]);

  const historyKey = useMemo(() => `bld:auditHistory:${pageId || 'unknown'}`, [pageId]);
  const history = useMemo(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [historyKey, savedTickSafe(report)]);

  const measure = async () => {
    setIsMeasuring(true);
    try {
      const { warnings } = computeDomAudits({ device, mediaMetaByUrl, tree });
      setDomWarnings(warnings);
    } finally {
      setIsMeasuring(false);
    }
  };

  const runIssueQuickFix = async (issue) => {
    if (!issue?.nodeId || !issue?.quickFix || typeof onQuickFix !== 'function') return;
    await onQuickFix({ nodeId: issue.nodeId, fix: issue.quickFix });
    const id = issue.id;
    setFixedFlashById((prev) => ({ ...prev, [id]: Date.now() }));
    window.setTimeout(() => {
      setFixedFlashById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2200);
    await measure();
  };

  useEffect(() => {
    if (!open) return;
    measure();
    const root = document.querySelector('.bld-canvas__live-mirror .live-doc') || document.querySelector('.bld-canvas__live-mirror');
    if (!root) return;
    const ro = new ResizeObserver(() => {
      // debounce-ish: one frame later
      window.requestAnimationFrame(() => measure());
    });
    ro.observe(root);
    roRef.current = ro;
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device, mediaMetaByUrl]);

  useEffect(() => {
    if (!open) return;
    onReportChange?.(report);
  }, [open, onReportChange, report]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const entry = { ts: Date.now(), scores: report.scores, counts: report.counts };
      const next = [entry, ...list].slice(0, 12);
      localStorage.setItem(historyKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [open, historyKey, report.counts, report.scores]);

  if (!open) return null;

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    } catch {
      // ignore
    }
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-page-${pageId || 'unknown'}-${device}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="bld-modal" role="dialog" aria-modal="true" aria-label="Audits" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 980, width: 'min(980px, 96vw)' }}>
        <header className="bld-modal__head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
            <div>
              <div style={{ fontWeight: 900 }}>Audits</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>Device: {device}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="bld-chip">Responsive {scores.responsive}/100</span>
              <span className="bld-chip">A11y {scores.accessibility}/100</span>
              <span className="bld-chip">Perf {scores.performance}/100</span>
              <span className="bld-chip">CLS {scores.cls}/100</span>
              <span className="bld-chip">SEO {scores.seo}/100</span>
              <span className="bld-chip">
                Issues {summaryCounts.total} (C{summaryCounts.critical}/W{summaryCounts.warning}/S{summaryCounts.suggestion})
              </span>
              <button className="bld-btn bld-btn--outline" type="button" onClick={measure} disabled={isMeasuring}>
                {isMeasuring ? 'Measuring…' : 'Re-scan'}
              </button>
              <button className="bld-btn bld-btn--ghost" type="button" onClick={copyReport} title="Copy JSON report">
                Copy report
              </button>
              <button className="bld-btn bld-btn--ghost" type="button" onClick={downloadReport} title="Download JSON report">
                Download
              </button>
              <button className="bld-btn bld-btn--primary" type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </header>

        <div className="bld-modal__body" style={{ display: 'grid', gap: 12 }}>
          <Section title="Optimization suggestions">
            {suggestions.length ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {suggestions.map((s, idx) => (
                  <div key={`${s.kind}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontWeight: 800 }}>{s.label}</span>
                    <span className="bld-chip">{s.kind}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>No suggestions.</div>
            )}
          </Section>

          <Section title="Warnings">
            {allWarnings.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {allWarnings.slice(0, 80).map((w) => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="bld-btn bld-btn--ghost"
                      onClick={() => (w.nodeId ? onSelectNode?.(w.nodeId) : null)}
                      style={{ flex: 1, textAlign: 'left', minWidth: 200 }}
                    >
                      <span style={{ fontWeight: 800 }}>{w.label}</span>
                      <span style={{ opacity: 0.65, marginLeft: 10, fontSize: 12 }}>
                        {w.kind} · {w.severity}
                        {w.nodeId ? ` · #${w.nodeId}` : ''}
                      </span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {fixedFlashById[w.id] ? (
                        <span className="bld-chip" role="status">
                          Fixed
                        </span>
                      ) : null}
                      {w.quickFix && w.nodeId ? (
                        <button type="button" className="bld-btn bld-btn--secondary" onClick={() => runIssueQuickFix(w)}>
                          {w.quickFix.label}
                        </button>
                      ) : w.fixUnavailableReason ? (
                        <span style={{ fontSize: 12, opacity: 0.75, maxWidth: 280 }} title={w.fixUnavailableReason}>
                          Fix unavailable: {w.fixUnavailableReason}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {allWarnings.length > 80 ? <div style={{ opacity: 0.7, fontSize: 12 }}>Showing first 80 warnings.</div> : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>No issues found.</div>
            )}
          </Section>

          <Section title="Button label audit">
            {treeResult.warnings.find((w) => w.id === 'a11y-btn-label-missing')?.nodes?.length ? (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {treeResult.warnings
                  .find((w) => w.id === 'a11y-btn-label-missing')
                  .nodes.slice(0, 20)
                  .map((n) => (
                    <InlineButtonLabelFix key={n.nodeId} node={n} onSelectNode={onSelectNode} onQuickFix={onQuickFix} onFixed={() => measure()} />
                  ))}
                {treeResult.warnings.find((w) => w.id === 'a11y-btn-label-missing').nodes.length > 20 ? (
                  <div style={{ opacity: 0.7, fontSize: 12 }}>Showing first 20.</div>
                ) : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>No buttons missing label.</div>
            )}
          </Section>

          <Section title="Menu aria-label audit">
            {treeResult.warnings.find((w) => w.id === 'a11y-menu-aria-missing')?.nodes?.length ? (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {treeResult.warnings
                  .find((w) => w.id === 'a11y-menu-aria-missing')
                  .nodes.slice(0, 20)
                  .map((n) => (
                    <InlineMenuAriaFix key={n.nodeId} node={n} onSelectNode={onSelectNode} onQuickFix={onQuickFix} onFixed={() => measure()} />
                  ))}
                {treeResult.warnings.find((w) => w.id === 'a11y-menu-aria-missing').nodes.length > 20 ? (
                  <div style={{ opacity: 0.7, fontSize: 12 }}>Showing first 20.</div>
                ) : null}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>All menus have an explicit aria-label.</div>
            )}
          </Section>

          <Section title="Image alt audit">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="bld-chip">Missing alt: {safeNum(treeResult.summary.imagesMissingAltCount)}</span>
              <span className="bld-chip">H1 count: {safeNum(treeResult.summary.h1Count)}</span>
            </div>
            {treeResult.warnings.find((w) => w.id === 'a11y-img-alt-missing')?.nodes?.length ? (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {treeResult.warnings
                  .find((w) => w.id === 'a11y-img-alt-missing')
                  .nodes.slice(0, 20)
                  .map((n) => (
                    <InlineAltFix key={n.nodeId} node={n} onSelectNode={onSelectNode} onQuickFix={onQuickFix} onFixed={() => measure()} />
                  ))}
                {treeResult.warnings.find((w) => w.id === 'a11y-img-alt-missing').nodes.length > 20 ? (
                  <div style={{ opacity: 0.7, fontSize: 12 }}>Showing first 20.</div>
                ) : null}
              </div>
            ) : null}
          </Section>

          <Section title="Audit history (local)">
            <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 8 }}>Stored in localStorage. Shows last 6 runs.</div>
            {history.length ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {history.slice(0, 6).map((h, idx) => (
                  <div key={h.ts || idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontWeight: 800 }}>{new Date(h.ts).toLocaleString()}</span>
                    <span className="bld-chip">Resp {h.scores?.responsive ?? '-'}</span>
                    <span className="bld-chip">A11y {h.scores?.accessibility ?? '-'}</span>
                    <span className="bld-chip">Perf {h.scores?.performance ?? '-'}</span>
                    <span className="bld-chip">CLS {h.scores?.cls ?? '-'}</span>
                    <span className="bld-chip">SEO {h.scores?.seo ?? '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>No history yet.</div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function savedTickSafe(v) {
  // Small helper to force memo invalidation when report changes.
  return JSON.stringify(v?.counts || {});
}

function InlineAltFix({ node, onSelectNode, onQuickFix, onFixed }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [node?.nodeId]);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button type="button" className="bld-btn bld-btn--ghost" onClick={() => onSelectNode?.(node.nodeId)} style={{ flex: 1, textAlign: 'left' }}>
        <strong>#{node.nodeId}</strong> {node.label}
      </button>
      <input className="bld-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Alt text" style={{ width: 240 }} />
      <button
        type="button"
        className="bld-btn bld-btn--secondary"
        onClick={async () => {
          await onQuickFix?.({ nodeId: node.nodeId, fix: { type: 'setProp', props: { alt: value }, label: 'Save alt' } });
          onFixed?.();
        }}
        disabled={!String(value || '').trim()}
      >
        Save alt
      </button>
    </div>
  );
}

function InlineButtonLabelFix({ node, onSelectNode, onQuickFix, onFixed }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [node?.nodeId]);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button type="button" className="bld-btn bld-btn--ghost" onClick={() => onSelectNode?.(node.nodeId)} style={{ flex: 1, textAlign: 'left' }}>
        <strong>#{node.nodeId}</strong> {node.label}
      </button>
      <input className="bld-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Button text" style={{ width: 240 }} />
      <button
        type="button"
        className="bld-btn bld-btn--secondary"
        onClick={async () => {
          await onQuickFix?.({ nodeId: node.nodeId, fix: { type: 'setProp', props: { text: value }, label: 'Save label' } });
          onFixed?.();
        }}
        disabled={!String(value || '').trim()}
      >
        Save label
      </button>
    </div>
  );
}

function InlineMenuAriaFix({ node, onSelectNode, onQuickFix, onFixed }) {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [node?.nodeId]);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button type="button" className="bld-btn bld-btn--ghost" onClick={() => onSelectNode?.(node.nodeId)} style={{ flex: 1, textAlign: 'left' }}>
        <strong>#{node.nodeId}</strong> {node.label}
      </button>
      <input className="bld-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Aria-label" style={{ width: 240 }} />
      <button
        type="button"
        className="bld-btn bld-btn--secondary"
        onClick={async () => {
          await onQuickFix?.({ nodeId: node.nodeId, fix: { type: 'setProp', props: { ariaLabel: value }, label: 'Save aria-label' } });
          onFixed?.();
        }}
        disabled={!String(value || '').trim()}
      >
        Save aria-label
      </button>
    </div>
  );
}

