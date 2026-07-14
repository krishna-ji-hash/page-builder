/**
 * Convert between blog listing `body` text and detail `content[]` blocks.
 */

/** @typedef {{ heading: string, text: string }} BlogContentBlock */

/**
 * @param {unknown} blocks
 * @returns {BlogContentBlock[]}
 */
export function normalizeBlogContentBlocks(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return [];
  return blocks
    .map((item, index) => {
      const t = item && typeof item === 'object' ? item : {};
      return {
        heading: String(t.heading || t.title || `Section ${index + 1}`).trim(),
        text: String(t.text || t.body || t.description || '').trim(),
      };
    })
    .filter((block) => block.heading || block.text);
}

/**
 * @param {string} body
 * @param {{ title?: string, description?: string }} [fallback]
 * @returns {BlogContentBlock[]}
 */
export function parseBlogBodyToContentBlocks(body, fallback = {}) {
  const text = String(body || '').trim();
  const title = String(fallback.title || '').trim();
  const description = String(fallback.description || '').trim();

  if (!text) {
    return [{ heading: title || 'Introduction', text: description || 'Add article body copy here.' }];
  }

  const chunks = text.split(/\n\n+/).filter(Boolean);
  /** @type {BlogContentBlock[]} */
  const blocks = [];
  let index = 0;

  while (index < chunks.length) {
    const chunk = chunks[index].trim();
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    const nextChunk = String(chunks[index + 1] || '').trim();
    const nextLines = nextChunk ? nextChunk.split('\n').map((line) => line.trim()).filter(Boolean) : [];

    if (
      lines.length === 1 &&
      lines[0].length <= 120 &&
      nextLines.length === 1 &&
      nextLines[0].length > 0
    ) {
      blocks.push({ heading: lines[0], text: nextLines[0] });
      index += 2;
      continue;
    }

    if (lines.length >= 2) {
      blocks.push({ heading: lines[0], text: lines.slice(1).join('\n').trim() });
    } else if (blocks.length === 0 && title) {
      blocks.push({ heading: title, text: chunk });
    } else {
      blocks.push({ heading: `Section ${blocks.length + 1}`, text: chunk });
    }
    index += 1;
  }

  return blocks.length
    ? blocks
    : [{ heading: title || 'Introduction', text: description || 'Add article body copy here.' }];
}

/**
 * @param {BlogContentBlock[]} content
 * @returns {string}
 */
export function serializeBlogContentToBody(content) {
  const blocks = normalizeBlogContentBlocks(content);
  if (!blocks.length) return '';
  return blocks
    .map((block) => {
      const heading = String(block.heading || '').trim();
      const text = String(block.text || '').trim();
      if (heading && text) return `${heading}\n\n${text}`;
      return heading || text;
    })
    .filter(Boolean)
    .join('\n\n');
}
