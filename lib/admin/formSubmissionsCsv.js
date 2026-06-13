function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function buildFormSubmissionsCsv(rows) {
  const submissions = Array.isArray(rows) ? rows : [];
  const fieldKeys = new Set();
  for (const row of submissions) {
    const values = row?.values && typeof row.values === 'object' ? row.values : {};
    Object.keys(values).forEach((key) => fieldKeys.add(key));
  }
  const fields = Array.from(fieldKeys).sort();
  const header = ['id', 'createdAt', 'pageId', 'formNodeId', ...fields];
  const lines = [header.map(csvEscape).join(',')];
  for (const row of submissions) {
    const values = row?.values && typeof row.values === 'object' ? row.values : {};
    const line = [
      row.id,
      row.createdAt,
      row.pageId,
      row.formNodeId,
      ...fields.map((key) => values[key] ?? ''),
    ];
    lines.push(line.map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}
