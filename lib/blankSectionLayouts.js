/**
 * Blank section layout presets for Add Section → Blank Layouts.
 * Hierarchy stays row → column → stack; multi-row grids use flex-wrap on the row.
 */

/** @typedef {{ id: string, label: string, description?: string, previewClass: string, previewSlots: number, columns: number, rowStyle_json?: object, columnStyle_json?: (index: number, total: number) => object }} BlankSectionLayout */

const GAP_PX = 24;
const HALF_BASIS = `calc(50% - ${GAP_PX / 2}px)`;
const THIRD_BASIS = `calc(33.333% - ${(GAP_PX * 2) / 3}px)`;
const QUARTER_BASIS = `calc(25% - ${(GAP_PX * 3) / 4}px)`;
const ROW_WRAP = {
  desktop: {
    layout: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP_PX,
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
  },
};

const ROW_STACKED = {
  desktop: {
    layout: {
      flexDirection: 'column',
      flexWrap: 'nowrap',
      gap: GAP_PX,
      alignItems: 'stretch',
    },
  },
};

/** @param {string} basis */
function columnBasis(basis, extra = {}) {
  return {
    desktop: {
      layout: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: basis,
        minWidth: 'min(100%, 240px)',
        maxWidth: '100%',
        ...extra,
      },
    },
  };
}

/** Equal flex columns in one row */
function equalFlexColumns() {
  return {
    desktop: {
      layout: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
        maxWidth: '100%',
      },
    },
  };
}

/** @param {number} grow @param {number} shrinkGrow */
function splitGrowColumn(grow, peerGrow) {
  return (index) => ({
    desktop: {
      layout: {
        flexGrow: index === 0 ? grow : peerGrow,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
        maxWidth: '100%',
      },
    },
  });
}

/** @type {BlankSectionLayout[]} */
export const BLANK_SECTION_LAYOUTS = [
  { id: 'col-1', label: '1 column', previewClass: '1', previewSlots: 1, columns: 1 },
  { id: 'col-2', label: '2 columns', previewClass: '2', previewSlots: 2, columns: 2 },
  { id: 'col-3', label: '3 columns', previewClass: '3', previewSlots: 3, columns: 3 },
  { id: 'col-4', label: '4 columns', previewClass: '4', previewSlots: 4, columns: 4 },
  {
    id: 'col-5',
    label: '5 columns',
    previewClass: '5',
    previewSlots: 5,
    columns: 5,
    columnStyle_json: () => equalFlexColumns(),
  },
  {
    id: 'col-6',
    label: '6 columns',
    previewClass: '6',
    previewSlots: 6,
    columns: 6,
    columnStyle_json: () => equalFlexColumns(),
  },

  {
    id: 'stack-3',
    label: '3 rows',
    description: '3 stacked rows (ek ke niche ek)',
    previewClass: 'stack-3',
    previewSlots: 3,
    columns: 3,
    rowStyle_json: ROW_STACKED,
    columnStyle_json: () => ({
      desktop: {
        layout: { flexGrow: 0, flexShrink: 0, width: '100%', maxWidth: '100%' },
      },
    }),
  },
  {
    id: 'stack-4',
    label: '4 rows',
    description: '4 stacked rows',
    previewClass: 'stack-4',
    previewSlots: 4,
    columns: 4,
    rowStyle_json: ROW_STACKED,
    columnStyle_json: () => ({
      desktop: {
        layout: { flexGrow: 0, flexShrink: 0, width: '100%', maxWidth: '100%' },
      },
    }),
  },

  {
    id: 'grid-2x2',
    label: '2×2 grid',
    description: '2 upar, 2 niche',
    previewClass: 'grid-2x2',
    previewSlots: 4,
    columns: 4,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: () => columnBasis(HALF_BASIS),
  },
  {
    id: 'grid-3x2',
    label: '3×2 grid',
    description: '3 upar, 3 niche',
    previewClass: 'grid-3x2',
    previewSlots: 6,
    columns: 6,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: () => columnBasis(THIRD_BASIS, { minWidth: 'min(100%, 200px)' }),
  },
  {
    id: 'grid-2x3',
    label: '2×3 grid',
    description: '2 columns × 3 rows',
    previewClass: 'grid-2x3',
    previewSlots: 6,
    columns: 6,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: () => columnBasis(HALF_BASIS),
  },
  {
    id: 'grid-3x3',
    label: '3×3 grid',
    description: '9 cells',
    previewClass: 'grid-3x3',
    previewSlots: 9,
    columns: 9,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: () => columnBasis(THIRD_BASIS, { minWidth: 'min(100%, 180px)' }),
  },
  {
    id: 'grid-2-1',
    label: '2 top, 1 bottom',
    description: '2 upar, full width niche',
    previewClass: 'grid-2-1',
    previewSlots: 3,
    columns: 3,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: (index) =>
      index < 2
        ? columnBasis(HALF_BASIS)
        : {
            desktop: {
              layout: {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: '100%',
                minWidth: '100%',
                maxWidth: '100%',
              },
            },
          },
  },
  {
    id: 'grid-1-2',
    label: '1 top, 2 bottom',
    description: 'Full width upar, 2 niche',
    previewClass: 'grid-1-2',
    previewSlots: 3,
    columns: 3,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: (index) =>
      index === 0
        ? {
            desktop: {
              layout: {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: '100%',
                minWidth: '100%',
                maxWidth: '100%',
              },
            },
          }
        : columnBasis(HALF_BASIS),
  },
  {
    id: 'grid-1-3',
    label: '1 top, 3 bottom',
    description: '1 upar, 3 columns niche',
    previewClass: 'grid-1-3',
    previewSlots: 4,
    columns: 4,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: (index) =>
      index === 0
        ? {
            desktop: {
              layout: {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: '100%',
                minWidth: '100%',
                maxWidth: '100%',
              },
            },
          }
        : columnBasis(THIRD_BASIS, { minWidth: 'min(100%, 200px)' }),
  },
  {
    id: 'grid-4-1',
    label: '4 top, 1 bottom',
    description: '4 upar, full width niche',
    previewClass: 'grid-4-1',
    previewSlots: 5,
    columns: 5,
    rowStyle_json: ROW_WRAP,
    columnStyle_json: (index) =>
      index < 4
        ? columnBasis(QUARTER_BASIS, { minWidth: 'min(100%, 160px)' })
        : {
            desktop: {
              layout: {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: '100%',
                minWidth: '100%',
                maxWidth: '100%',
              },
            },
          },
  },

  {
    id: 'split-1-2',
    label: '1/3 + 2/3',
    previewClass: 'split-1-2',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(1, 2),
  },
  {
    id: 'split-2-1',
    label: '2/3 + 1/3',
    previewClass: 'split-2-1',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(2, 1),
  },
  {
    id: 'split-1-3',
    label: '1/4 + 3/4',
    previewClass: 'split-1-3',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(1, 3),
  },
  {
    id: 'split-3-1',
    label: '3/4 + 1/4',
    previewClass: 'split-3-1',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(3, 1),
  },
  {
    id: 'split-1-4',
    label: '1/5 + 4/5',
    previewClass: 'split-1-4',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(1, 4),
  },
  {
    id: 'split-4-1',
    label: '4/5 + 1/5',
    previewClass: 'split-4-1',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(4, 1),
  },
  {
    id: 'split-2-3',
    label: '2/5 + 3/5',
    previewClass: 'split-2-3',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(2, 3),
  },
  {
    id: 'split-3-2',
    label: '3/5 + 2/5',
    previewClass: 'split-3-2',
    previewSlots: 2,
    columns: 2,
    columnStyle_json: splitGrowColumn(3, 2),
  },

  {
    id: 'center-1',
    label: 'Centered column',
    description: 'Single narrow column, centered',
    previewClass: 'center-1',
    previewSlots: 1,
    columns: 1,
    rowStyle_json: {
      desktop: {
        layout: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'stretch',
        },
      },
    },
    columnStyle_json: () => ({
      desktop: {
        layout: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
        size: { width: '100%', maxWidth: '720px' },
      },
    }),
  },
  {
    id: 'bento-3',
    label: 'Bento (3 cells)',
    description: 'Bada left, 2 chote right',
    previewClass: 'bento-3',
    previewSlots: 3,
    columns: 3,
    columnStyle_json: (index) => ({
      desktop: {
        layout: {
          flexGrow: index === 0 ? 2 : 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: index === 0 ? 'min(100%, 320px)' : 'min(100%, 200px)',
          maxWidth: '100%',
        },
      },
    }),
  },
];

const BY_ID = Object.fromEntries(BLANK_SECTION_LAYOUTS.map((l) => [l.id, l]));

/** @param {string} id */
export function getBlankSectionLayout(id) {
  return BY_ID[String(id || '')] || null;
}

/** Legacy numeric picker: 1–6 equal columns */
export function getBlankSectionLayoutForColumnCount(count) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1) return null;
  return getBlankSectionLayout(`col-${n}`) || getBlankSectionLayout('col-1');
}
