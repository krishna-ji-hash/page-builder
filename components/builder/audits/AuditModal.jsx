'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildOptimizationSuggestions, runTreeAudits } from '@/lib/audits/auditEngine';
import { buildAuditReport } from '@/lib/audits/auditReport';
import { computeDomAudits } from '@/lib/audits/domAuditEngine';

function safeNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
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
  overflowByNodeId = null,
  onClose,
  onSelectNode,
  onQuickFix,
  onReportChange,
}) {
  const [domWarnings, setDomWarnings] = useState([]);
  const [effectiveDevice, setEffectiveDevice] = useState(device);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [fixedFlashById, setFixedFlashById] = useState({});
  const roRef = useRef(null);

  const treeResult = useMemo(() => runTreeAudits({ tree, pageSeo, projectConfig }), [tree, pageSeo, projectConfig]);
  const allWarnings = useMemo(() => [...(treeResult.warnings || []), ...(domWarnings || [])], [treeResult.warnings, domWarnings]);

  const report = useMemo(
    () => buildAuditReport({ pageId, device, effectiveDevice, warnings: allWarnings }),
    [allWarnings, device, effectiveDevice, pageId]
  );
  const scores = report.scores;
  const summaryCounts = report.counts;

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
      const result = computeDomAudits({ device, mediaMetaByUrl, tree, overflowByNodeId });
      setDomWarnings(result.warnings || []);
      if (result.effectiveDevice) setEffectiveDevice(result.effectiveDevice);
    } finally {
      setIsMeasuring(false);
    }
  };

  const runIssueQuickFix = async (issue) => {
    if (!issue?.quickFix || typeof onQuickFix !== 'function') return;
    if (!issue.nodeId && !issue.quickFix.pageLevel) return;
    await onQuickFix({ nodeId: issue.nodeId ?? null, fix: issue.quickFix });
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
  }, [open, device, mediaMetaByUrl, overflowByNodeId]);

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
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                Device: {device}
                {effectiveDevice !== device ? ` (measured as ${effectiveDevice})` : ''}
              </div>
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
                      {w.quickFix && (w.nodeId || w.quickFix.pageLevel) ? (
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

