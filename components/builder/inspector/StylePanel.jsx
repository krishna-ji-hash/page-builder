'use client';

import { useMemo } from 'react';
import TypographyControls from './TypographyControls';
import ColorControls from './ColorControls';
import SpacingControls from './SpacingControls';
import BorderControls from './BorderControls';
import MenuControls from './MenuControls';
import BackgroundControls from './BackgroundControls';
import EffectsControls from './EffectsControls';
import TransformEffectsControls from './TransformEffectsControls';
import StylePresetsPanel from './StylePresetsPanel';
import CompoundChromePanel from './CompoundChromePanel';
import { InspectorPanel, InspectorSection } from './InspectorUi';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { normalizeStylePresets } from '@/lib/stylePresetsStore';
import { getCompoundWidgetMeta } from '@/lib/compoundWidgetRegistry';

export default function StylePanel({
  selectedNode,
  capabilities,
  form,
  onChange,
  onPatchForm,
  projectId,
  onPreviewStylePatch,
  onCommitStylePatch,
  onClearPreviewStyle,
  onActiveSpacingEdit,
  onApplyPreset,
  nestedFeatureTabsNode = null,
  onSelectFeatureTabs = null,
  jsonErrors = {},
  /** Props/chrome updates (compound widgets) — defaults to onChange if omitted. */
  onCompoundChromeChange = null,
}) {
  const chromeOnChange = onCompoundChromeChange || onChange;
  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const compoundMeta = getCompoundWidgetMeta(selectedNode?.nodeType);
  const isCompoundChrome = Boolean(compoundMeta?.caps?.supportsCompoundChrome);
  const isSplitHeroCarousel =
    selectedNode?.nodeType === 'carousel' &&
    String(selectedNode?.props?.variant || '').toLowerCase() === 'splithero';
  const caps = capabilities || {};
  const { stylePresets } = useBuilderTheme();
  const presets = useMemo(() => normalizeStylePresets(stylePresets).presets || [], [stylePresets]);
  const presetOptions = useMemo(
    () => presets.filter((p) => p.nodeType === selectedNode?.nodeType),
    [presets, selectedNode?.nodeType]
  );
  const showPresetUi =
    selectedNode?.nodeType &&
    selectedNode.nodeType !== 'menu' &&
    selectedNode.nodeType !== 'carousel' &&
    (presetOptions.length > 0 || String(form.stylePresetId || '').trim() !== '' || String(form.styleVariant || '').trim() !== '');

  return (
    <InspectorPanel title="Style">
      <StylePresetsPanel selectedNode={selectedNode} onApplyPreset={onApplyPreset} />

      {isCompoundChrome ? (
        <p className="bld-field-note" style={{ margin: '0 0 12px' }}>
          <strong>{compoundMeta.label}</strong> uses <code>props.chrome</code> + widget CSS — not generic typography.
          Shell margin/padding below still uses <code>style_json</code>. Content editing: <strong>Content</strong> tab.
        </p>
      ) : null}

      {isCompoundChrome ? (
        <CompoundChromePanel
          selectedNode={selectedNode}
          form={form}
          onChange={chromeOnChange}
          jsonErrors={jsonErrors}
          nestedFeatureTabsNode={nestedFeatureTabsNode}
          onSelectFeatureTabs={onSelectFeatureTabs}
        />
      ) : null}

      {showPresetUi && !isCompoundChrome ? (
        <InspectorSection title="Preset & variant" defaultOpen keywords="preset variant reusable styles">
          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Preset</label>
              <select
                className="bld-input"
                value={String(form.stylePresetId || '')}
                onChange={(e) => onChange('stylePresetId', e.target.value)}
              >
                <option value="">— None —</option>
                {presetOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id}
                  </option>
                ))}
              </select>
              <p className="bld-field-note">Attach a global preset via <code>props.presetId</code>.</p>
            </div>
            <div className="bld-field">
              <label className="bld-label">Variant</label>
              <input
                className="bld-input"
                value={String(form.styleVariant || '')}
                onChange={(e) => onChange('styleVariant', e.target.value)}
                placeholder="primary / secondary / glass"
              />
              <p className="bld-field-note">Uses <code>props.variant</code> for style (not menu/carousel).</p>
            </div>
          </div>
          <div className="bld-field-grid" style={{ marginTop: 8 }}>
            <button type="button" className="bld-chip" onClick={() => onChange('stylePresetId', '')}>
              Detach preset
            </button>
            <button type="button" className="bld-chip" onClick={() => onChange('styleVariant', '')}>
              Clear variant
            </button>
          </div>
        </InspectorSection>
      ) : null}

      {isSplitHeroCarousel ? (
        <p className="bld-field-note" style={{ margin: '0 0 12px' }}>
          <strong>Typography</strong> styles the hero <strong>headline (title)</strong>. Body text size/color:{' '}
          <strong>Content</strong> tab → Hero body style.
        </p>
      ) : null}

      {caps.supportsTypography !== false ? (
        <InspectorSection title="Typography" defaultOpen keywords="font size weight line height text">
          <TypographyControls form={form} onUpdate={onChange} selectedNodeType={selectedNode?.nodeType || ''} />
        </InspectorSection>
      ) : null}

      {caps.supportsTypography !== false || caps.supportsBackground !== false ? (
        <InspectorSection title="Colors" keywords="text background fill">
          <ColorControls form={form} onUpdate={onChange} showBackground={false} />
        </InspectorSection>
      ) : null}

      {caps.supportsBackground !== false ? (
        <InspectorSection title="Background" keywords="image gradient overlay">
          <BackgroundControls form={form} onUpdate={onChange} projectId={projectId} selectedNode={selectedNode} />
        </InspectorSection>
      ) : null}

      {caps.supportsSpacing !== false ? (
        <InspectorSection title="Spacing" defaultOpen={selectedNode?.nodeType === 'row'} keywords="margin padding box">
        {selectedNode?.nodeType === 'row' ? (
          <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 10 }}>
            Padding controls inner section space. Use linked sides or drag values in the box model.
          </p>
        ) : null}
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
        </InspectorSection>
      ) : null}

      {caps.supportsBorder !== false ? (
        <InspectorSection title="Border" keywords="radius width color outline">
          <BorderControls form={form} onUpdate={onChange} />
        </InspectorSection>
      ) : null}

      {caps.supportsEffects !== false ? (
        <InspectorSection title="Shadow & opacity" keywords="box shadow opacity">
          <EffectsControls form={form} onUpdate={onChange} selectedNode={selectedNode} />
        </InspectorSection>
      ) : null}

      {caps.supportsTransform !== false ? <TransformEffectsControls form={form} onUpdate={onChange} /> : null}

      {selectedNode.nodeType === 'menu' && caps.supportsMenu !== false ? (
        <InspectorSection title="Menu" keywords="navigation links">
          <MenuControls form={form} onUpdate={onChange} />
        </InspectorSection>
      ) : null}
    </InspectorPanel>
  );
}
