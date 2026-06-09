import { scoreFromWarnings } from './auditEngine.js';

const KIND_KEYS = ['responsive', 'a11y', 'performance', 'cls', 'seo'];

export function dedupeWarnings(warnings = []) {
  const seen = new Set();
  return (warnings || []).filter((w) => {
    if (!w?.id || seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
}

export function groupWarningsByKind(warnings = []) {
  const byKind = Object.fromEntries(KIND_KEYS.map((k) => [k, []]));
  for (const w of warnings || []) {
    const k = w.kind || 'responsive';
    if (!byKind[k]) byKind[k] = [];
    byKind[k].push(w);
  }
  return byKind;
}

export function summarizeWarningCounts(warnings = []) {
  const out = { total: warnings.length, critical: 0, warning: 0, suggestion: 0 };
  for (const w of warnings) {
    if (w.severity === 'critical') out.critical += 1;
    else if (w.severity === 'warning') out.warning += 1;
    else out.suggestion += 1;
  }
  return out;
}

export function computeAuditScores(warnings = []) {
  const byKind = groupWarningsByKind(warnings);
  return {
    responsive: scoreFromWarnings(byKind.responsive),
    accessibility: scoreFromWarnings(byKind.a11y),
    performance: scoreFromWarnings(byKind.performance),
    cls: scoreFromWarnings(byKind.cls),
    seo: scoreFromWarnings(byKind.seo),
  };
}

export function buildAuditReport({ pageId, device, effectiveDevice, warnings = [] }) {
  const merged = dedupeWarnings(warnings);
  const scores = computeAuditScores(merged);
  const counts = summarizeWarningCounts(merged);
  return {
    pageId,
    device,
    effectiveDevice: effectiveDevice || device,
    scores,
    counts,
    issues: merged.map((w) => ({
      id: w.id,
      kind: w.kind,
      severity: w.severity,
      label: w.label,
      nodeId: w.nodeId ?? null,
    })),
  };
}
