'use client';

function hasOverflow(diag) {
  return Boolean(diag?.horizontal || diag?.vertical || diag?.flexWrapUnexpected);
}

export default function OverflowSuggestions({
  selectedNode,
  deviceLabel = 'Desktop',
  device = 'desktop',
  overflowDiagnostics,
  onApplyPatch,
}) {
  if (!selectedNode) return null;
  if (!hasOverflow(overflowDiagnostics)) return null;

  const isHeaderRow = selectedNode.nodeType === 'row' && (selectedNode.props?.meta?.isHeader || selectedNode.props?.meta?.role === 'header');
  const nodeType = selectedNode.nodeType;

  const chips = [];

  // Generic safe suggestions
  chips.push({
    id: 'reduce-gap',
    label: 'Reduce gap',
    patch: { layout: { gap: 8, gapScale: 'sm' } },
  });
  chips.push({
    id: 'enable-wrap',
    label: 'Enable wrap',
    patch: { layout: { flexWrap: 'wrap' } },
  });
  chips.push({
    id: 'decrease-padding',
    label: 'Decrease padding',
    patch: { spacing: { padding: '8px 8px 8px 8px' } },
  });
  if (nodeType === 'column' || nodeType === 'stack' || nodeType === 'image') {
    chips.push({
      id: 'full-width',
      label: 'Set width 100%',
      patch: { size: { width: '100%' } },
    });
  }

  // Mobile-specific suggestion (only shows as chip; user must click while on Mobile)
  chips.push({
    id: 'hide-on-mobile',
    label: 'Hide on mobile',
    hint: 'Switch to Mobile, then click',
    patch: { layout: { display: 'none' } },
    requiresDevice: 'mobile',
  });

  // Header-specific (non-destructive)
  if (isHeaderRow) {
    chips.push({
      id: 'header-reduce-gap',
      label: 'Reduce menu gap',
      patch: { layout: { gap: 8, gapScale: 'sm' } },
    });
    chips.push({
      id: 'header-wrap',
      label: 'Allow header wrap',
      patch: { layout: { flexWrap: 'wrap', alignItems: 'center' } },
    });
    chips.push({
      id: 'header-stack-mobile',
      label: 'Stack on mobile',
      hint: 'Switch to Mobile, then click',
      patch: { layout: { flexDirection: 'column', flexWrap: 'wrap' } },
      requiresDevice: 'mobile',
    });
  }

  return (
    <div className="bld-overflow-suggest">
      <div className="bld-overflow-suggest__head">
        <span className="bld-overflow-suggest__title">Overflow detected</span>
        <span className="bld-overflow-suggest__meta">({deviceLabel})</span>
      </div>
      <p className="bld-field-note" style={{ marginTop: 6 }}>
        These suggestions are optional. Click to apply to the current breakpoint only.
      </p>
      <div className="bld-overflow-suggest__chips">
        {chips.map((c) => {
          const title = c.hint || 'Apply suggestion';
          const disabled = Boolean(c.requiresDevice) && String(c.requiresDevice) !== String(device);
          return (
            <button
              key={c.id}
              type="button"
              className="bld-chip"
              disabled={disabled}
              title={title}
              onClick={() => onApplyPatch?.(c.patch, c)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

