'use client';

import { useState } from 'react';
import TypographyControls from './TypographyControls';
import ColorControls from './ColorControls';
import SpacingControls from './SpacingControls';
import BorderControls from './BorderControls';
import LayoutControls from './LayoutControls';
import MenuControls from './MenuControls';
import SizeControls from './SizeControls';
import BackgroundControls from './BackgroundControls';
import ResponsiveVisibilityControls from './ResponsiveVisibilityControls';
import { isHeaderRowNode } from '@/lib/rowLayoutMeta';

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bld-style-section">
      <button type="button" className="bld-style-section__head" onClick={() => setOpen((p) => !p)}>
        <span className="bld-style-section__title">{title}</span>
        <span className="bld-style-section__toggle" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open ? <div className="bld-style-section__body">{children}</div> : null}
    </div>
  );
}

export default function StylePanel({
  selectedNode,
  form,
  onChange,
  projectId,
  onPreviewStylePatch,
  onCommitStylePatch,
  onClearPreviewStyle,
  onActiveSpacingEdit,
  deviceLabel = 'Desktop',
  visibilityByDevice = { desktop: false, tablet: false, mobile: false },
  onVisibilityForDevice,
  onApplyFlexPreset,
  onResetLayoutKeys,
  onRowLayoutLockedChange,
  onHeaderLayoutQuickAction,
}) {
  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const layoutHint = `Layout, gap, and width below apply to the ${deviceLabel} breakpoint (same as the device switcher above). They do not overwrite other breakpoints unless you change those devices too.`;
  const isHeaderSection = selectedNode?.nodeType === 'row' && isHeaderRowNode(selectedNode);

  return (
    <div className="bld-panel">
      <div className="bld-panel__head">Style</div>
      {selectedNode.nodeType === 'row' ? (
        <p className="bld-panel__hint" style={{ margin: '0 0 12px' }}>
          Poora section chhota / patla: pehle yahi Style tab me Spacing → Padding (top + bottom) kam karein. Phir Size → Height px — 0 = auto. Agar ab bhi zyada uncha ho to canvas par andar ki column ya image select karke un par bhi Style → Size ya Content me image height dekhein (section template kabhi column par min-height laga deta hai).
        </p>
      ) : null}
      <Section title="Visibility by breakpoint" defaultOpen>
        <ResponsiveVisibilityControls
          desktopHidden={visibilityByDevice.desktop}
          tabletHidden={visibilityByDevice.tablet}
          mobileHidden={visibilityByDevice.mobile}
          disabled={!onVisibilityForDevice}
          onChange={(targetDevice, visible) => onVisibilityForDevice?.(targetDevice, visible)}
        />
      </Section>
      <Section title="Typography">
        <TypographyControls form={form} onUpdate={onChange} />
      </Section>
      <Section title="Colors">
        <ColorControls form={form} onUpdate={onChange} showBackground={false} />
      </Section>
      <Section title="Background">
        <BackgroundControls form={form} onUpdate={onChange} projectId={projectId} />
      </Section>
      <Section title="Spacing">
        <SpacingControls
          form={form}
          onUpdate={onChange}
          onPreviewStylePatch={onPreviewStylePatch}
          onCommitStylePatch={onCommitStylePatch}
          onClearPreviewStyle={onClearPreviewStyle}
          onActiveSpacingEdit={onActiveSpacingEdit}
          selectedNodeId={selectedNode?.id}
        />
      </Section>
      <Section title="Border">
        <BorderControls form={form} onUpdate={onChange} />
      </Section>
      <Section title="Layout (responsive)">
        <p className="bld-field-note" style={{ marginBottom: 10 }}>
          {layoutHint}
        </p>
        {isHeaderSection && typeof onHeaderLayoutQuickAction === 'function' ? (
          <div className="bld-field" style={{ marginBottom: 12 }}>
            <label className="bld-label">Header placement</label>
            <p className="bld-field-note" style={{ marginTop: 0 }}>
              Use <strong>Layout</strong> below for bar width and columns. <strong>Advanced</strong> tab sets position
              (fixed / absolute / offsets). Quick presets:
            </p>
            <div className="bld-field-grid" style={{ marginTop: 8 }}>
              <button type="button" className="bld-chip" onClick={() => onHeaderLayoutQuickAction('sticky')}>
                Sticky on scroll
              </button>
              <button type="button" className="bld-chip" onClick={() => onHeaderLayoutQuickAction('static')}>
                Normal flow (not sticky)
              </button>
            </div>
          </div>
        ) : null}
        <LayoutControls
          selectedNode={selectedNode}
          form={form}
          onUpdate={onChange}
          hideSize={false}
          breakpointLabel={deviceLabel}
          onApplyFlexPreset={onApplyFlexPreset}
          onResetLayoutKeys={onResetLayoutKeys}
          onRowLayoutLockedChange={onRowLayoutLockedChange}
        />
      </Section>
      <Section title="Size">
        <SizeControls selectedNode={selectedNode} form={form} onUpdate={onChange} />
      </Section>
      {selectedNode.nodeType === 'menu' ? (
        <Section title="Menu">
          <MenuControls form={form} onUpdate={onChange} />
        </Section>
      ) : null}
    </div>
  );
}
