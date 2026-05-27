'use client';

import LayoutControls from './LayoutControls';
import ProLayoutFields from './ProLayoutFields';
import ProSizeFields from './ProSizeFields';
import ResponsiveVisibilityControls from './ResponsiveVisibilityControls';
import SectionLayoutControls from './SectionLayoutControls';
import FormSpacingControls from './FormSpacingControls';
import InspectorTipChips from './InspectorTipChips';
import { InspectorPanel, InspectorSection } from './InspectorUi';
import { isFooterRowNode, isHeaderRowNode } from '@/lib/rowLayoutMeta';
import { isRootPageRow } from '@/lib/liveDocSectionSpacing';
import { resolveHeaderLayoutMode } from '@/lib/headerLayoutMode';
import { resolveRootStripLayout, resolveSectionWidthMode } from '@/lib/livePageCssVars';
import { SECTION_WIDTH_MODES } from '@/lib/liveContentContainer';
import { sectionRowHasLayoutControls } from '@/lib/sectionLayout';

export default function LayoutPanel({
  selectedNode,
  form,
  onChange,
  onContentChange,
  deviceLabel = 'Desktop',
  visibilityByDevice = { desktop: false, tablet: false, mobile: false },
  onVisibilityForDevice,
  onApplyFlexPreset,
  onResetLayoutKeys,
  onRowLayoutLockedChange,
  onHeaderLayoutQuickAction,
  pageTree = null,
  stripLayoutTargetRow = null,
  onPatchRootStripLayout = null,
  onPatchHeaderLayoutMode = null,
  onPatchSectionLayout = null,
}) {
  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const stripRow = stripLayoutTargetRow?.nodeType === 'row' ? stripLayoutTargetRow : null;
  const isRootStripRow =
    stripRow && Array.isArray(pageTree) && pageTree.length > 0 && isRootPageRow(pageTree, stripRow);
  const stripRowIsHeader = stripRow ? isHeaderRowNode(stripRow) : false;
  const stripRowIsFooter = stripRow ? isFooterRowNode(stripRow) : false;
  const stripRowIsLandmark = stripRowIsHeader || stripRowIsFooter;
  const stripMeta = stripRow?.props?.meta || {};
  const resolvedStrip = stripRow
    ? resolveRootStripLayout(stripMeta, {
        isLiveDocRootRow: Boolean(isRootStripRow),
        isHeaderRow: stripRowIsHeader,
        isFooterRow: stripRowIsFooter,
        isRootContentRow: Boolean(isRootStripRow && !stripRowIsLandmark),
      })
    : '';
  const sectionWidthMode = stripRow
    ? resolveSectionWidthMode(stripMeta, {
        isLiveDocRootRow: Boolean(isRootStripRow),
        isHeaderRow: stripRowIsHeader,
        isFooterRow: stripRowIsFooter,
        isRootContentRow: Boolean(isRootStripRow && !stripRowIsLandmark),
      })
    : '';
  const stripSelectValue =
    sectionWidthMode === SECTION_WIDTH_MODES.BOXED
      ? 'contained'
      : sectionWidthMode === SECTION_WIDTH_MODES.FULL_WIDTH
        ? 'fullBleed'
        : sectionWidthMode === SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED
          ? 'full'
          : resolvedStrip === 'full'
            ? 'full'
            : 'contained';
  const headerLayoutMode =
    stripRow && stripRowIsHeader ? resolveHeaderLayoutMode(stripRow.props?.meta || {}) : 'boxed';
  const stripSelectionIsRow = selectedNode?.nodeType === 'row' && stripRow && selectedNode.id === stripRow.id;
  const isHeaderSection = selectedNode?.nodeType === 'row' && isHeaderRowNode(selectedNode);
  const isForm = selectedNode?.nodeType === 'form';
  const showSectionLayout =
    stripRow && sectionRowHasLayoutControls(stripRow.props?.meta) && typeof onPatchSectionLayout === 'function';
  const layoutHint = `Layout applies to ${deviceLabel} only — other breakpoints keep their own overrides.`;

  return (
    <InspectorPanel title="Layout">
      <InspectorSection title="Visibility" defaultOpen keywords="hide show breakpoint">
        <ResponsiveVisibilityControls
          desktopHidden={visibilityByDevice.desktop}
          tabletHidden={visibilityByDevice.tablet}
          mobileHidden={visibilityByDevice.mobile}
          disabled={!onVisibilityForDevice}
          onChange={(targetDevice, visible) => onVisibilityForDevice?.(targetDevice, visible)}
        />
      </InspectorSection>

      {showSectionLayout ? (
        <InspectorSection title="Section direction" keywords="grid column row section">
          <SectionLayoutControls sectionRow={stripRow} onApplyLayout={onPatchSectionLayout} />
        </InspectorSection>
      ) : null}

      {isForm && typeof onContentChange === 'function' ? (
        <InspectorSection title="Form spacing" keywords="form fields gap">
          <FormSpacingControls selectedNode={selectedNode} onChange={onContentChange} />
        </InspectorSection>
      ) : null}

      {stripRow && typeof onPatchRootStripLayout === 'function' ? (
        <InspectorSection title="Section width" defaultOpen keywords="full bleed contained boxed">
          {!stripSelectionIsRow ? (
            <p className="bld-field-note" style={{ marginTop: 0 }}>
              Width controls apply to the parent <strong>section row</strong> for this selection.
            </p>
          ) : null}
          <div className="bld-field">
            <label className="bld-label" htmlFor="root-strip-layout">
              Width mode
            </label>
            {isRootStripRow && stripRowIsHeader && typeof onPatchHeaderLayoutMode === 'function' ? (
              <select
                id="root-strip-layout"
                className="bld-input"
                value={headerLayoutMode === 'spread' ? 'full' : 'contained'}
                onChange={(e) => onPatchHeaderLayoutMode(e.target.value === 'full' ? 'spread' : 'boxed')}
              >
                <option value="contained">Contained</option>
                <option value="full">Full width (screen)</option>
              </select>
            ) : isRootStripRow && stripRowIsFooter ? (
              <select id="root-strip-layout" className="bld-input" value="full" disabled aria-readonly>
                <option value="full">Full width (screen)</option>
              </select>
            ) : (
              <select
                id="root-strip-layout"
                className="bld-input"
                value={stripSelectValue}
                onChange={(e) => onPatchRootStripLayout(e.target.value)}
              >
                {isRootStripRow ? (
                  <>
                    <option value="full">Full width background (boxed content)</option>
                    <option value="fullBleed">Full width (edge to edge)</option>
                    <option value="contained">Contained</option>
                  </>
                ) : (
                  <>
                    <option value="contained">Contained</option>
                    <option value="full">Full width (parent)</option>
                  </>
                )}
              </select>
            )}
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title="Flex & flow" defaultOpen keywords="flex direction gap justify align wrap">
        <p className="bld-field-note" style={{ margin: '0 0 10px' }}>
          {layoutHint}
        </p>
        {isHeaderSection && typeof onHeaderLayoutQuickAction === 'function' ? (
          <div className="bld-field" style={{ marginBottom: 12 }}>
            <label className="bld-label">Header placement</label>
            <div className="bld-field-grid" style={{ marginTop: 8 }}>
              <button type="button" className="bld-chip" onClick={() => onHeaderLayoutQuickAction('sticky')}>
                Sticky on scroll
              </button>
              <button type="button" className="bld-chip" onClick={() => onHeaderLayoutQuickAction('static')}>
                Normal flow
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
      </InspectorSection>

      <InspectorSection title="Display & position" keywords="display overflow z-index position order flex grow">
        <ProLayoutFields form={form} onUpdate={onChange} onResetLayoutKeys={onResetLayoutKeys} />
      </InspectorSection>

      <InspectorSection title="Size" defaultOpen keywords="width height min max">
        <ProSizeFields
          form={form}
          onUpdate={onChange}
          onResetLayoutKeys={onResetLayoutKeys}
          selectedNode={selectedNode}
        />
        {stripRow ? (
          <InspectorTipChips
            chips={['Padding shrinks inner space', 'Height 0 = auto', 'Check min-height on columns']}
          />
        ) : null}
      </InspectorSection>
    </InspectorPanel>
  );
}
