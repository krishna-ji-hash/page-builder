function escCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * CSV export — one row per page issue + summary row per page.
 */
export function buildSeoReportCsv(report) {
  const lines = [
    ['Page', 'Slug', 'Score', 'Critical', 'Warnings', 'Words', 'Images', 'Missing Alt', 'Orphan', 'Top Issue'].join(','),
  ];

  for (const p of report.pages || []) {
    const topIssue = (p.issues || []).find((i) => i.severity !== 'passed');
    lines.push(
      [
        escCsv(p.pageName),
        escCsv(p.pageSlug),
        p.score,
        p.summary?.critical ?? 0,
        p.summary?.warning ?? 0,
        p.modules?.content?.wordCount ?? '',
        p.modules?.images?.total ?? '',
        p.modules?.images?.missingAlt ?? '',
        p.modules?.links?.isOrphan ? 'yes' : 'no',
        escCsv(topIssue?.label || ''),
      ].join(',')
    );
  }

  lines.push('');
  lines.push(['Project score', report.projectScore].join(','));
  lines.push(['Indexed pages', report.widgets?.indexedPages].join(','));
  lines.push(['Missing metadata pages', report.widgets?.missingMetadata].join(','));

  return lines.join('\n');
}

export function buildSeoReportJson(report) {
  return JSON.stringify(report, null, 2);
}

/**
 * Printable HTML report — user saves as PDF via browser print.
 */
export function buildSeoReportHtml(report, { projectName = 'Project', generatedAt = new Date().toISOString() } = {}) {
  const rows = (report.pages || [])
    .map(
      (p) => `
    <tr>
      <td>${escHtml(p.pageName)}</td>
      <td><code>${escHtml(p.pageSlug)}</code></td>
      <td><strong>${p.score}</strong></td>
      <td>${p.summary?.critical ?? 0}</td>
      <td>${p.summary?.warning ?? 0}</td>
      <td>${p.modules?.content?.wordCount ?? '—'}</td>
      <td>${p.modules?.images?.missingAlt ?? 0}</td>
      <td>${p.modules?.links?.isOrphan ? 'Yes' : 'No'}</td>
    </tr>`
    )
    .join('');

  const topIssues = (report.topIssues || [])
    .map((i) => `<li><strong>${escHtml(i.id)}</strong> — ${i.count} pages</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SEO Audit Report — ${escHtml(projectName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #1e293b; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .widgets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .widget { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .widget strong { display: block; font-size: 1.4rem; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-size: 11px; text-transform: uppercase; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>Enterprise SEO Audit Report</h1>
  <p class="meta">${escHtml(projectName)} · Generated ${escHtml(generatedAt)} · Project score <strong>${report.projectScore ?? 0}/100</strong></p>
  <div class="widgets">
    <div class="widget"><span>Indexed pages</span><strong>${report.widgets?.indexedPages ?? 0}</strong></div>
    <div class="widget"><span>Missing metadata</span><strong>${report.widgets?.missingMetadata ?? 0}</strong></div>
    <div class="widget"><span>Missing schema</span><strong>${report.widgets?.missingSchema ?? 0}</strong></div>
    <div class="widget"><span>Missing alt</span><strong>${report.widgets?.missingAlt ?? 0}</strong></div>
  </div>
  <h2>Top issues</h2>
  <ul>${topIssues || '<li>No issues</li>'}</ul>
  <h2>Pages</h2>
  <table>
    <thead><tr><th>Page</th><th>Slug</th><th>Score</th><th>Critical</th><th>Warnings</th><th>Words</th><th>Missing alt</th><th>Orphan</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = function() { /* optional: window.print(); */ };</script>
</body>
</html>`;
}
