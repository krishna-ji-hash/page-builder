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
import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

function rowShellHeightPxFromStyle(styleJson) {
  const sj = styleJson && typeof styleJson === 'object' ? styleJson : {};
  const desktop = sj.desktop && typeof sj.desktop === 'object' ? sj.desktop : sj;
  const size = desktop.size && typeof desktop.size === 'object' ? desktop.size : {};
  const h = size.height ?? desktop.height ?? '';
  const m = String(h).match(/^([\d.]+)\s*px$/i);
  return m ? Math.round(Number(m[1])) : '';
}

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
  onPatchHeaderBehavior = null,
  onPatchSectionLayout = null,
  onPatchStripRowHeightPx = null,
  disabled = false,
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
  const isSplitHeroCarousel =
    selectedNode?.nodeType === 'carousel' && selectedNode?.props?.variant === 'splitHero';
  const splitHeroParentRow = isSplitHeroCarousel ? stripRow : null;

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

      {isSplitHeroCarousel ? (
        <InspectorSection title="Split hero section" defaultOpen keywords="height row shell">
          <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 8 }}>
            <strong>Section height</strong> is the <strong>parent section row</strong> in the tree (the block with the blue outline), not this carousel node.
          </p>
          <ol className="bld-field-note" style={{ marginTop: 0, marginBottom: 8, paddingLeft: 18, margin: '0 0 8px' }}>
            <li>Select the <strong>section row</strong> in the left tree (above the carousel).</li>
            <li>Open <strong>Layout → Size</strong> and set <strong>HEIGHT (PX)</strong> — that controls overall block height.</li>
            <li>Or use <strong>Row shell height</strong> below when the parent row is detected.</li>
            <li>Reduce <strong>vertical padding</strong> on that row if the block still looks too tall.</li>
          </ol>
          <InspectorNumField
            id="split-hero-template-height"
            label="Template default height (px)"
            min={200}
            max={1200}
            value={selectedNode.props?.sectionHeightPx ?? 560}
            disabled={disabled || typeof onContentChange !== 'function'}
            onChange={
              typeof onContentChange === 'function'
                ? inspectorNumStringChange(onContentChange, 'sectionHeightPx')
                : undefined
            }
          />
          <p className="bld-field-note">Used when inserting new Split Hero sections from the library.</p>
          {splitHeroParentRow ? (
            <InspectorNumField
              id="split-hero-row-shell-height"
              label="Row shell height (px)"
              min={0}
              max={9999}
              value={rowShellHeightPxFromStyle(splitHeroParentRow.style_json)}
              placeholder="auto"
              disabled={disabled || typeof onPatchStripRowHeightPx !== 'function'}
              onChange={onPatchStripRowHeightPx}
            />
          ) : (
            <p className="bld-field-note" style={{ marginTop: 8, color: 'var(--bld-danger, #f87171)' }}>
              No section row found above this carousel in the tree. Wrap the carousel in a section row, then set height on that row.
            </p>
          )}
          <p className="bld-field-note">Row shell height updates the parent row (blue outline). 0 = auto.</p>
          <InspectorNumField
            id="split-hero-section-min-height"
            label="Section min height (px)"
            min={0}
            max={9999}
            value={selectedNode.props?.splitHeroSectionMinHeightPx ?? 0}
            placeholder="0 = live CSS 420px floor"
            disabled={disabled || typeof onContentChange !== 'function'}
            onChange={
              typeof onContentChange === 'function'
                ? inspectorNumStringChange(onContentChange, 'splitHeroSectionMinHeightPx')
                : undefined
            }
          />
          <InspectorNumField
            id="split-hero-section-max-height"
            label="Section max height (px)"
            min={0}
            max={9999}
            value={selectedNode.props?.splitHeroSectionMaxHeightPx ?? ''}
            placeholder="optional cap"
            disabled={disabled || typeof onContentChange !== 'function'}
            onChange={
              typeof onContentChange === 'function'
                ? inspectorNumStringChange(onContentChange, 'splitHeroSectionMaxHeightPx')
                : undefined
            }
          />
          <p className="bld-field-note">Min/max apply to the carousel shell on the live site (e.g. 520 overrides the 420px CSS minimum).</p>
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
            {stripRowIsHeader && typeof onPatchHeaderLayoutMode === 'function' ? (
              <>
                <select
                  id="root-strip-layout"
                  className="bld-input"
                  value={headerLayoutMode === 'spread' ? 'full' : 'contained'}
                  onChange={(e) => onPatchHeaderLayoutMode(e.target.value === 'full' ? 'spread' : 'boxed')}
                >
                  <option value="contained">Contained (centered bar)</option>
                  <option value="full">Full width (screen)</option>
                </select>
                <p className="bld-field-note" style={{ marginTop: 8 }}>
                  Applies to this header row only. Announcement bar and main nav are separate rows — select each row in
                  Layers to set its width.
                </p>
              </>
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
        {isHeaderSection && typeof onPatchHeaderBehavior === 'function' ? (
          <>
            <div className="bld-field">
              <label className="bld-label" htmlFor="header-behavior-type">
                Header type
              </label>
              <select
                id="header-behavior-type"
                className="bld-input"
                value={form.headerBehaviorType || 'normal'}
                onChange={(e) => onPatchHeaderBehavior({ type: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="sticky">Sticky</option>
                <option value="fixed">Fixed</option>
                <option value="revealOnScroll">Reveal on scroll</option>
                <option value="mainReveal">Main + reveal</option>
              </select>
            </div>
            {form.headerBehaviorType === 'mainReveal' ||
            form.headerBehaviorType === 'revealOnScroll' ? (
              <div className="bld-field">
                <label className="bld-label" htmlFor="header-behavior-variant">
                  Reveal variant
                </label>
                <select
                  id="header-behavior-variant"
                  className="bld-input"
                  value={form.headerBehaviorVariant || 'default'}
                  onChange={(e) => onPatchHeaderBehavior({ variant: e.target.value })}
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="glass">Glass</option>
                  <option value="floating">Floating</option>
                  <option value="cta">CTA focus</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            ) : null}
            {form.headerBehaviorType === 'revealOnScroll' ||
            form.headerBehaviorType === 'mainReveal' ? (
              <div className="bld-field">
                <label className="bld-label" htmlFor="header-reveal-after">
                  Reveal after (px scroll)
                </label>
                <input
                  id="header-reveal-after"
                  type="number"
                  className="bld-input"
                  min={0}
                  max={2000}
                  value={form.headerRevealAfter ?? 120}
                  onChange={(e) =>
                    onPatchHeaderBehavior({ revealAfter: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
            ) : null}
            {form.headerBehaviorType === 'revealOnScroll' ||
            form.headerBehaviorType === 'mainReveal' ? (
              <div className="bld-field">
                <span className="bld-label">Reveal bar style (scroll ke baad)</span>
                <p className="bld-field-note" style={{ marginTop: 0 }}>
                  Top par transparent rehta hai; scroll par ye bar solid dikhegi.
                </p>
                <div className="bld-field-grid">
                  <InspectorNumField
                    id="header-reveal-bar-width"
                    label="Bar width (% viewport)"
                    min={40}
                    max={100}
                    value={form.headerRevealBarMaxWidthPct ?? 100}
                    onChange={(n) => onChange('headerRevealBarMaxWidthPct', String(n ?? 100))}
                  />
                  <InspectorNumField
                    id="header-reveal-bar-offset"
                    label="Top offset (px)"
                    min={0}
                    max={48}
                    value={form.headerRevealBarOffsetTopPx ?? 0}
                    onChange={(n) => onChange('headerRevealBarOffsetTopPx', String(n ?? 0))}
                  />
                  <div className="bld-field">
                    <label className="bld-label" htmlFor="header-reveal-bar-bg">
                      Background color
                    </label>
                    <input
                      id="header-reveal-bar-bg"
                      type="color"
                      className="bld-input"
                      value={
                        /^#[0-9a-f]{6}$/i.test(String(form.headerRevealBarBackgroundColor || ''))
                          ? form.headerRevealBarBackgroundColor
                          : '#ffffff'
                      }
                      onChange={(e) => onChange('headerRevealBarBackgroundColor', e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="bld-field">
                    <label className="bld-label" htmlFor="header-reveal-bar-border">
                      Border color
                    </label>
                    <input
                      id="header-reveal-bar-border"
                      type="color"
                      className="bld-input"
                      value={
                        /^#[0-9a-f]{6}$/i.test(String(form.headerRevealBarBorderColor || ''))
                          ? form.headerRevealBarBorderColor
                          : '#e2e8f0'
                      }
                      onChange={(e) => onChange('headerRevealBarBorderColor', e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <InspectorNumField
                    id="header-reveal-bar-border-w"
                    label="Border width (px)"
                    min={0}
                    max={8}
                    value={form.headerRevealBarBorderWidthPx ?? 0}
                    onChange={(n) => onChange('headerRevealBarBorderWidthPx', String(n ?? 0))}
                  />
                  <InspectorNumField
                    id="header-reveal-bar-radius"
                    label="Corner radius (px)"
                    min={0}
                    max={48}
                    value={form.headerRevealBarBorderRadiusPx ?? 0}
                    onChange={(n) => onChange('headerRevealBarBorderRadiusPx', String(n ?? 0))}
                  />
                  <div className="bld-field">
                    <label className="bld-label" htmlFor="header-reveal-bar-shadow">
                      Shadow
                    </label>
                    <select
                      id="header-reveal-bar-shadow"
                      className="bld-input"
                      value={form.headerRevealBarShadow || 'none'}
                      onChange={(e) => onChange('headerRevealBarShadow', e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => {
                      onChange('headerRevealBarMaxWidthPct', '100');
                      onChange('headerRevealBarBorderRadiusPx', '0');
                      onChange('headerRevealBarBorderWidthPx', '0');
                    }}
                  >
                    Full width flat
                  </button>
                  <button
                    type="button"
                    className="bld-chip"
                    onClick={() => {
                      onChange('headerRevealBarMaxWidthPct', '92');
                      onChange('headerRevealBarBorderRadiusPx', '16');
                      onChange('headerRevealBarBorderWidthPx', '1');
                      onChange('headerRevealBarShadow', 'light');
                    }}
                  >
                    Floating pill
                  </button>
                </div>
              </div>
            ) : null}
          </>
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
          disabled={disabled}
        />
      </InspectorSection>

      <InspectorSection title="Display & position" keywords="display overflow z-index position order flex grow">
        <ProLayoutFields form={form} onUpdate={onChange} onResetLayoutKeys={onResetLayoutKeys} disabled={disabled} />
      </InspectorSection>

      <InspectorSection title="Size" defaultOpen keywords="width height min max">
        <ProSizeFields
          form={form}
          onUpdate={onChange}
          onResetLayoutKeys={onResetLayoutKeys}
          selectedNode={selectedNode}
          disabled={disabled}
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
