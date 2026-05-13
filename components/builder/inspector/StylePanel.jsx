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
import EffectsControls from './EffectsControls';
import InspectorTipChips from '@/components/builder/inspector/InspectorTipChips';
import { isHeaderRowNode } from '@/lib/rowLayoutMeta';
import { isRootPageRow } from '@/lib/liveDocSectionSpacing';

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
  onPatchForm,
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
  pageTree = null,
  /** Nearest section row for strip width (may differ from `selectedNode` when a child widget is selected). */
  stripLayoutTargetRow = null,
  onPatchRootStripLayout = null,
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
  const stripRow = stripLayoutTargetRow?.nodeType === 'row' ? stripLayoutTargetRow : null;
  const isRootStripRow =
    stripRow &&
    Array.isArray(pageTree) &&
    pageTree.length > 0 &&
    isRootPageRow(pageTree, stripRow);
  const rootStripValue = String(stripRow?.props?.meta?.rootStripLayout || '').toLowerCase().trim();
  const stripSelectValue = rootStripValue === 'full' ? 'full' : 'contained';
  const stripSelectionIsRow = selectedNode?.nodeType === 'row' && stripRow && selectedNode.id === stripRow.id;

  return (
    <div className="bld-panel">
      <div className="bld-panel__head">Style</div>
      {stripRow && typeof onPatchRootStripLayout === 'function' ? (
        <Section title="Section width (this strip)" defaultOpen>
          {!stripSelectionIsRow ? (
            <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 8 }}>
              You have a <strong>widget or column</strong> selected; width below applies to the{' '}
              <strong>section row</strong> that wraps it. Click the section’s top bar on the canvas to select the row
              directly.
            </p>
          ) : null}
          <p className="bld-field-note" style={{ marginTop: 0 }}>
            {isRootStripRow ? (
              <>
                <strong>Top-level strip</strong> (header, hero, footer, etc.): full width uses the whole screen on the
                live site; contained follows the page content column.
              </>
            ) : (
              <>
                <strong>Nested row</strong> inside a column or stack: full width spans that parent; contained keeps the
                row within the usual content width for that level.
              </>
            )}
          </p>
          <div className="bld-field">
            <label className="bld-label" htmlFor="root-strip-layout">
              Width
            </label>
            <select
              id="root-strip-layout"
              className="bld-input"
              value={stripSelectValue}
              onChange={(e) => onPatchRootStripLayout(e.target.value)}
            >
              <option value="contained">Contained</option>
              <option value="full">{isRootStripRow ? 'Full width (screen)' : 'Full width (parent)'}</option>
            </select>
            <InspectorTipChips
              size="xs"
              style={{ marginTop: 4 }}
              chips={
                isRootStripRow
                  ? ['Header / hero → Full width', 'Body strips → Often contained', 'Global header: same control']
                  : ['Full width = column edge to edge', 'Contained = theme max width (capped by parent)']
              }
            />
          </div>
        </Section>
      ) : null}
      {stripRow ? (
        <InspectorTipChips
          chips={[
            'Reduce padding',
            'Top + bottom',
            'Then height',
            'Zero = auto',
            'Still tall?',
            'Pick column',
            'Or image',
            'Size / Content',
            'Check min-height',
          ]}
        />
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
      <p className="bld-field-note" style={{ margin: '0 0 12px' }}>
        Space between page sections (default or one strip): <strong>Theme</strong> tab →{' '}
        <strong>Page spacing (this page)</strong>.
      </p>
      <Section title="Typography">
        <TypographyControls form={form} onUpdate={onChange} selectedNodeType={selectedNode?.nodeType || ''} />
      </Section>
      <Section title="Colors">
        <ColorControls form={form} onUpdate={onChange} showBackground={false} />
      </Section>
      <Section title="Background">
        <BackgroundControls form={form} onUpdate={onChange} projectId={projectId} selectedNode={selectedNode} />
      </Section>
      <Section title="Spacing">
        <InspectorTipChips
          chips={[
            'Vertical space',
            'Padding inside',
            'Margin outside',
            'Per-side values',
            'Blur to save',
            'New line: pre-wrap',
            'Or multiline Content',
          ]}
        />
        <SpacingControls
          form={form}
          onUpdate={onChange}
          onPatchForm={onPatchForm}
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
      <Section title="Shadow & opacity">
        <EffectsControls form={form} onUpdate={onChange} selectedNode={selectedNode} />
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
          hideSize
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
