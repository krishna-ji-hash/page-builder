'use client';

import { useMemo } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { buildFlexLayoutPresets } from '@/lib/flexLayoutPresets';
import { GAP_SCALE_IDS } from '@/lib/layoutGapUtils';
import { isLayoutLockedRow } from '@/lib/rowLayoutMeta';
import { themeSpacingPx } from '@/lib/siteDesignTheme';
import FlexLayoutPreview from './FlexLayoutPreview';
import FlexLayoutControlsPanel from './FlexLayoutControlsPanel';

const DIRECTION_OPTIONS = ['row', 'column'];
const WRAP_OPTIONS = [
  { value: 'nowrap', label: 'No wrap' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'wrap-reverse', label: 'Wrap reverse' },
];
const ALIGN_OPTIONS = ['stretch', 'flex-start', 'center', 'flex-end'];
const JUSTIFY_OPTIONS = [
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
];

function LayoutFieldLabel({ children, resetKeys, onResetLayoutKeys, disabled }) {
  return (
    <div className="bld-field-label-row">
      <span className="bld-label">{children}</span>
      {typeof onResetLayoutKeys === 'function' && Array.isArray(resetKeys) && resetKeys.length ? (
        <button
          type="button"
          className="bld-btn-reset"
          disabled={disabled}
          onClick={() => onResetLayoutKeys(resetKeys)}
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

function RowContentWidthControls({ form, onUpdate }) {
  const mode = form.containerWidthMode === 'boxed' || form.containerWidthMode === 'custom' ? 'boxed' : 'full';
  const pct = Math.min(100, Math.max(10, Number(form.rowWidthPercent) || 100));
  const maxPx = Math.min(2400, Math.max(320, Number(form.containerWidthPx) || 1200));

  return (
    <div className="bld-field bld-field--row-content-width">
      <label className="bld-label">Content width</label>
      <p className="bld-field-note">Section (row) width on the page — boxed vs full-width headers.</p>
      <select className="bld-input" value={mode} onChange={(e) => onUpdate('containerWidthMode', e.target.value)}>
        <option value="full">Full width</option>
        <option value="boxed">Boxed (max-width + centered)</option>
      </select>
      {mode === 'boxed' ? (
        <div className="bld-field-grid" style={{ marginTop: 8 }}>
          <div className="bld-field" style={{ gridColumn: '1 / -1' }}>
            <label className="bld-label">Max width (px)</label>
            <input
              className="bld-input"
              type="number"
              min={320}
              max={2400}
              step={10}
              value={maxPx}
              onChange={(e) => onUpdate('containerWidthPx', e.target.value)}
            />
            <input
              className="bld-range"
              type="range"
              min={480}
              max={1920}
              step={10}
              value={maxPx}
              onChange={(e) => onUpdate('containerWidthPx', e.target.value)}
              aria-label="Max width"
            />
          </div>
        </div>
      ) : (
        <div className="bld-field" style={{ marginTop: 8 }}>
          <label className="bld-label">Width ({pct}%)</label>
          <input
            className="bld-range"
            type="range"
            min={10}
            max={100}
            step={1}
            value={pct}
            onChange={(e) => onUpdate('rowWidthPercent', e.target.value)}
            aria-label="Section width percent"
          />
          <p className="bld-field-note">Under 100% the section is narrowed and centered (max-width %).</p>
        </div>
      )}
    </div>
  );
}

export default function LayoutControls({
  selectedNode,
  form,
  onUpdate,
  hideSize = false,
  breakpointLabel = null,
  onApplyFlexPreset,
  onResetLayoutKeys,
  onRowLayoutLockedChange,
}) {
  const { siteTheme } = useBuilderTheme();
  const flexPresets = useMemo(() => buildFlexLayoutPresets(siteTheme), [siteTheme]);
  const gapScaleOptions = useMemo(
    () => GAP_SCALE_IDS.map((id) => ({ id, label: id, px: themeSpacingPx(siteTheme, id) })),
    [siteTheme]
  );

  const isRow = selectedNode?.nodeType === 'row';
  const isFlexContainer =
    selectedNode?.nodeType === 'row' ||
    selectedNode?.nodeType === 'column' ||
    selectedNode?.nodeType === 'stack';

  const canHeaderPreset = isRow || selectedNode?.nodeType === 'stack';
  const canCenterPreset =
    selectedNode?.nodeType === 'stack' || selectedNode?.nodeType === 'column' || selectedNode?.nodeType === 'row';

  const layoutLocked = isLayoutLockedRow(selectedNode);
  const flexDisabled = layoutLocked;
  const effectiveLayoutDirection =
    (form.layoutDirection && String(form.layoutDirection).trim()) || (isRow ? 'row' : 'column');

  return (
    <div className="bld-control-stack">
      {breakpointLabel ? (
        <p className="bld-field-note" style={{ margin: '0 0 8px' }}>
          Breakpoint: <strong>{breakpointLabel}</strong>
        </p>
      ) : null}
      {isRow ? <RowContentWidthControls form={form} onUpdate={onUpdate} /> : null}
      {isFlexContainer ? (
        <>
          {isRow ? (
            <div className="bld-field bld-field--lock-row">
              <label className="bld-checkbox-row">
                <input
                  type="checkbox"
                  checked={layoutLocked}
                  onChange={(e) => onRowLayoutLockedChange?.(e.target.checked)}
                />
                <span>Lock layout for this section</span>
              </label>
              <p className="bld-field-note" style={{ marginTop: 4 }}>
                When locked, flex direction, alignment, wrap, and gap cannot be changed until you unlock.
              </p>
            </div>
          ) : null}

          {typeof onApplyFlexPreset === 'function' ? (
            <div className="bld-field">
              <label className="bld-label">Quick presets</label>
              <p className="bld-field-note" style={{ marginTop: 0 }}>
                One-click flex sets stored in layout for this breakpoint only. Gaps follow theme spacing tokens.
              </p>
              <div className="bld-field-grid" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="bld-chip"
                  disabled={!canHeaderPreset || flexDisabled}
                  title={
                    flexDisabled
                      ? 'Unlock layout to use presets'
                      : !canHeaderPreset
                        ? 'Use on section (row) or stack'
                        : undefined
                  }
                  onClick={() => onApplyFlexPreset(flexPresets.headerRow)}
                >
                  Header layout
                </button>
                <button
                  type="button"
                  className="bld-chip"
                  disabled={!canCenterPreset || flexDisabled}
                  title={flexDisabled ? 'Unlock layout to use presets' : undefined}
                  onClick={() => onApplyFlexPreset(flexPresets.centerStack)}
                >
                  Center stack
                </button>
              </div>
            </div>
          ) : null}

          <div className="bld-field">
            <div className="bld-field-label-row">
              <span className="bld-label">Flex preview</span>
              {typeof onResetLayoutKeys === 'function' ? (
                <button
                  type="button"
                  className="bld-btn-reset"
                  disabled={flexDisabled}
                  onClick={() =>
                    onResetLayoutKeys([
                      'flexDirection',
                      'justifyContent',
                      'alignItems',
                      'flexWrap',
                      'gap',
                      'gapScale',
                    ])
                  }
                >
                  Reset all flex
                </button>
              ) : null}
            </div>
            <FlexLayoutPreview
              flexDirection={effectiveLayoutDirection}
              justifyContent={form.layoutJustify || 'flex-start'}
              alignItems={form.layoutAlign || 'stretch'}
            />
          </div>

          <div className="bld-field">
            <div className="bld-field-label-row">
              <span className="bld-label">Flex layout controls</span>
              <span className="bld-field-note" style={{ margin: 0 }}>
                DevTools/Webflow style visual editor
              </span>
            </div>
            <FlexLayoutControlsPanel
              flexDirection={effectiveLayoutDirection}
              flexWrap={form.layoutFlexWrap || 'nowrap'}
              justifyContent={form.layoutJustify || 'flex-start'}
              alignItems={form.layoutAlign || 'stretch'}
              alignContent={form.layoutAlignContent || 'stretch'}
              disabled={flexDisabled}
              onChange={(patch) => {
                if ('flexDirection' in patch) onUpdate('layoutDirection', patch.flexDirection);
                if ('flexWrap' in patch) onUpdate('layoutFlexWrap', patch.flexWrap);
                if ('justifyContent' in patch) onUpdate('layoutJustify', patch.justifyContent);
                if ('alignItems' in patch) onUpdate('layoutAlign', patch.alignItems);
                if ('alignContent' in patch) onUpdate('layoutAlignContent', patch.alignContent);
              }}
            />
          </div>

          <div className="bld-field">
            <div className="bld-field-label-row">
              <span className="bld-label">Justify shortcuts</span>
              {typeof onResetLayoutKeys === 'function' ? (
                <button
                  type="button"
                  className="bld-btn-reset"
                  disabled={flexDisabled}
                  onClick={() => onResetLayoutKeys(['justifyContent'])}
                >
                  Reset
                </button>
              ) : null}
            </div>
            <div className="bld-field-grid">
              <button
                type="button"
                className="bld-chip"
                disabled={flexDisabled}
                onClick={() => onUpdate('layoutJustify', 'flex-start')}
              >
                Start
              </button>
              <button type="button" className="bld-chip" disabled={flexDisabled} onClick={() => onUpdate('layoutJustify', 'center')}>
                Center
              </button>
              <button type="button" className="bld-chip" disabled={flexDisabled} onClick={() => onUpdate('layoutJustify', 'flex-end')}>
                End
              </button>
              <button
                type="button"
                className="bld-chip"
                disabled={flexDisabled}
                onClick={() => onUpdate('layoutJustify', 'space-between')}
              >
                Space-between
              </button>
            </div>
          </div>

          <div className="bld-field-grid">
            <div className="bld-field">
              <LayoutFieldLabel
                resetKeys={['flexDirection']}
                onResetLayoutKeys={onResetLayoutKeys}
                disabled={flexDisabled}
              >
                Direction
              </LayoutFieldLabel>
              <select
                className="bld-input"
                disabled={flexDisabled}
                value={effectiveLayoutDirection}
                onChange={(e) => onUpdate('layoutDirection', e.target.value)}
              >
                {DIRECTION_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="bld-field">
              <LayoutFieldLabel resetKeys={['flexWrap']} onResetLayoutKeys={onResetLayoutKeys} disabled={flexDisabled}>
                Flex wrap
              </LayoutFieldLabel>
              <select
                className="bld-input"
                disabled={flexDisabled}
                value={form.layoutFlexWrap || 'nowrap'}
                onChange={(e) => onUpdate('layoutFlexWrap', e.target.value)}
              >
                {WRAP_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bld-field-grid">
            <div className="bld-field">
              <LayoutFieldLabel
                resetKeys={['justifyContent']}
                onResetLayoutKeys={onResetLayoutKeys}
                disabled={flexDisabled}
              >
                Justify content
              </LayoutFieldLabel>
              <select
                className="bld-input"
                disabled={flexDisabled}
                value={form.layoutJustify || 'flex-start'}
                onChange={(e) => onUpdate('layoutJustify', e.target.value)}
              >
                {JUSTIFY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="bld-field">
              <LayoutFieldLabel resetKeys={['alignItems']} onResetLayoutKeys={onResetLayoutKeys} disabled={flexDisabled}>
                Align items
              </LayoutFieldLabel>
              <select
                className="bld-input"
                disabled={flexDisabled}
                value={form.layoutAlign || 'stretch'}
                onChange={(e) => onUpdate('layoutAlign', e.target.value)}
              >
                {ALIGN_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bld-field-grid">
            <div className="bld-field">
              <LayoutFieldLabel
                resetKeys={['gap', 'gapScale']}
                onResetLayoutKeys={onResetLayoutKeys}
                disabled={flexDisabled}
              >
                Gap (px)
              </LayoutFieldLabel>
              <input
                className="bld-input"
                type="number"
                min="0"
                disabled={flexDisabled}
                value={form.layoutGapPx ?? 0}
                onChange={(e) => onUpdate('layoutGapPx', e.target.value)}
              />
            </div>
            <div className="bld-field">
              <LayoutFieldLabel resetKeys={['gapScale']} onResetLayoutKeys={onResetLayoutKeys} disabled={flexDisabled}>
                Gap scale
              </LayoutFieldLabel>
              <select
                className="bld-input"
                disabled={flexDisabled}
                value={form.layoutGapScale || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    onResetLayoutKeys?.(['gapScale']);
                    return;
                  }
                  onUpdate('layoutGapScale', v);
                }}
              >
                <option value="">Custom px only…</option>
                {gapScaleOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.px}px)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : null}

      {!hideSize && !isRow ? (
        <>
          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Width</label>
              <select className="bld-input" value={form.widthMode || 'auto'} onChange={(e) => onUpdate('widthMode', e.target.value)}>
                <option value="auto">auto</option>
                <option value="full">100%</option>
                <option value="px">px</option>
              </select>
            </div>
            {form.widthMode === 'px' ? (
              <div className="bld-field">
                <label className="bld-label">Width px</label>
                <input className="bld-input" type="number" min="0" value={form.widthPx ?? 0} onChange={(e) => onUpdate('widthPx', e.target.value)} />
              </div>
            ) : (
              <div className="bld-field">
                <label className="bld-label">Height px</label>
                <input className="bld-input" type="number" min="0" value={form.heightPx ?? 0} onChange={(e) => onUpdate('heightPx', e.target.value)} />
              </div>
            )}
          </div>
          {form.widthMode === 'px' ? (
            <div className="bld-field">
              <label className="bld-label">Height px</label>
              <input className="bld-input" type="number" min="0" value={form.heightPx ?? 0} onChange={(e) => onUpdate('heightPx', e.target.value)} />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
