/**
 * Paragraph blocks support multiple `<p>` lines inside one widget (not nested paragraph widgets).
 * contenteditable often emits `<div>` — normalize to `<p>` before sanitize/save.
 */

/**
 * @param {string} html
 * @returns {string}
 */
export function normalizeParagraphBlockHtml(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  let s = collapseRepeatedAmpEntities(html).trim();

  s = s.replace(/<div(\s[^>]*)?>/gi, '<p$1>').replace(/<\/div>/gi, '</p>');
  s = s.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');

  if (!/<p[\s>]/i.test(s)) {
    if (/<br\s*\/?>/i.test(s)) {
      const parts = s
        .split(/<br\s*\/?>/gi)
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        s = parts.map((part) => `<p>${part}</p>`).join('');
      } else {
        s = `<p>${s}</p>`;
      }
    } else {
      s = `<p>${s}</p>`;
    }
  }

  s = s.replace(/<p>\s*<\/p>/gi, '');
  return s.trim();
}

function collapseRepeatedAmpEntities(html) {
  if (!html.includes('&amp;')) return html;
  let out = html;
  let prev;
  do {
    prev = out;
    out = out.replace(/&amp;amp;/gi, '&amp;');
  } while (out !== prev);
  return out;
}
