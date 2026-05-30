/** Shared font list for project brand + per-widget typography controls. */

export const FONT_CATEGORIES = [
  {
    id: 'serif',
    label: 'Serif',
    hint: 'Small strokes (serifs) on letter ends',
    options: [
      {
        id: 'times-new-roman',
        label: 'Times New Roman',
        stack: '"Times New Roman", Times, serif',
      },
      {
        id: 'georgia',
        label: 'Georgia',
        stack: 'Georgia, "Times New Roman", serif',
      },
      {
        id: 'palatino',
        label: 'Palatino',
        stack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
      },
      {
        id: 'garamond',
        label: 'Garamond',
        stack: 'Garamond, "Times New Roman", serif',
      },
    ],
  },
  {
    id: 'sans-serif',
    label: 'Sans-serif',
    hint: 'Clean strokes, no serifs',
    options: [
      {
        id: 'system-ui',
        label: 'System UI',
        stack: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      },
      {
        id: 'arial',
        label: 'Arial',
        stack: 'Arial, Helvetica, sans-serif',
      },
      {
        id: 'helvetica',
        label: 'Helvetica',
        stack: 'Helvetica, Arial, sans-serif',
      },
      {
        id: 'verdana',
        label: 'Verdana',
        stack: 'Verdana, Geneva, sans-serif',
      },
      {
        id: 'trebuchet',
        label: 'Trebuchet MS',
        stack: '"Trebuchet MS", Helvetica, sans-serif',
      },
      {
        id: 'segoe-ui',
        label: 'Segoe UI',
        stack: '"Segoe UI", system-ui, sans-serif',
      },
    ],
  },
  {
    id: 'monospace',
    label: 'Monospace',
    hint: 'Fixed-width letters',
    options: [
      {
        id: 'courier-new',
        label: 'Courier New',
        stack: '"Courier New", Courier, monospace',
      },
      {
        id: 'consolas',
        label: 'Consolas',
        stack: 'Consolas, "Courier New", monospace',
      },
      {
        id: 'monaco',
        label: 'Monaco',
        stack: 'Monaco, Consolas, monospace',
      },
      {
        id: 'lucida-console',
        label: 'Lucida Console',
        stack: '"Lucida Console", Monaco, monospace',
      },
    ],
  },
  {
    id: 'cursive',
    label: 'Cursive',
    hint: 'Handwriting / calligraphy style',
    options: [
      {
        id: 'comic-sans',
        label: 'Comic Sans MS',
        stack: '"Comic Sans MS", "Comic Sans", cursive',
      },
      {
        id: 'brush-script',
        label: 'Brush Script MT',
        stack: '"Brush Script MT", cursive',
      },
      {
        id: 'apple-chancery',
        label: 'Apple Chancery',
        stack: '"Apple Chancery", cursive',
      },
    ],
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    hint: 'Decorative display fonts',
    options: [
      {
        id: 'impact',
        label: 'Impact',
        stack: 'Impact, Haettenschweiler, fantasy',
      },
      {
        id: 'chalkduster',
        label: 'Chalkduster',
        stack: 'Chalkduster, fantasy',
      },
      {
        id: 'papyrus',
        label: 'Papyrus',
        stack: 'Papyrus, fantasy',
      },
    ],
  },
];

export const PROJECT_FONT_OPTIONS = FONT_CATEGORIES.flatMap((cat) => cat.options);

export const DEFAULT_FONT_STACK =
  PROJECT_FONT_OPTIONS.find((o) => o.id === 'system-ui')?.stack ||
  'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Short names used in legacy widget typography dropdowns. */
export const WIDGET_FONT_LABELS = PROJECT_FONT_OPTIONS.map((o) => o.label);

const stackById = new Map(PROJECT_FONT_OPTIONS.map((o) => [o.id, o.stack]));
const idByStack = new Map(PROJECT_FONT_OPTIONS.map((o) => [normalizeFontKey(o.stack), o.id]));
const idByLabel = new Map(PROJECT_FONT_OPTIONS.map((o) => [o.label.toLowerCase(), o.id]));

function normalizeFontKey(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Resolve preset id, label, or stack string to a CSS font-family stack. */
export function resolveFontStack(value) {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_FONT_STACK;
  if (stackById.has(raw)) return stackById.get(raw);
  const byLabel = idByLabel.get(raw.toLowerCase());
  if (byLabel) return stackById.get(byLabel);
  const byStack = idByStack.get(normalizeFontKey(raw));
  if (byStack) return stackById.get(byStack);
  return raw;
}

function matchFontIdByPattern(raw) {
  const s = normalizeFontKey(raw);
  for (const opt of PROJECT_FONT_OPTIONS) {
    if (s.includes(normalizeFontKey(opt.label))) return opt.id;
    const primary = String(opt.stack).split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    if (primary && s.includes(primary)) return opt.id;
  }
  return null;
}

/** Best matching preset id for a stored font-family value. */
export function fontOptionIdFromStack(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'system-ui';
  if (stackById.has(raw)) return raw;
  const byLabel = idByLabel.get(raw.toLowerCase());
  if (byLabel) return byLabel;
  const byStack = idByStack.get(normalizeFontKey(raw));
  if (byStack) return byStack;
  const byPattern = matchFontIdByPattern(raw);
  if (byPattern) return byPattern;
  return 'custom';
}

export function findFontOptionById(id) {
  return PROJECT_FONT_OPTIONS.find((o) => o.id === id) || null;
}
