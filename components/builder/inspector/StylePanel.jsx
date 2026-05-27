'use client';

import TypographyControls from './TypographyControls';
import ColorControls from './ColorControls';
import SpacingControls from './SpacingControls';
import BorderControls from './BorderControls';
import MenuControls from './MenuControls';
import BackgroundControls from './BackgroundControls';
import EffectsControls from './EffectsControls';
import TransformEffectsControls from './TransformEffectsControls';
import StylePresetsPanel from './StylePresetsPanel';
import { InspectorPanel, InspectorSection } from './InspectorUi';

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
  onApplyPreset,
}) {
  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const isFeatureTabs = selectedNode?.nodeType === 'tabs';

  return (
    <InspectorPanel title="Style">
      <StylePresetsPanel selectedNode={selectedNode} onApplyPreset={onApplyPreset} />

      {isFeatureTabs ? (
        <p className="bld-field-note" style={{ margin: '0 0 12px' }}>
          Tab content and images: <strong>Content</strong> tab. Size and colors here apply to the Feature tabs block.
        </p>
      ) : null}

      <InspectorSection title="Typography" defaultOpen keywords="font size weight line height text">
        <TypographyControls form={form} onUpdate={onChange} selectedNodeType={selectedNode?.nodeType || ''} />
      </InspectorSection>

      <InspectorSection title="Colors" keywords="text background fill">
        <ColorControls form={form} onUpdate={onChange} showBackground={false} />
      </InspectorSection>

      <InspectorSection title="Background" keywords="image gradient overlay">
        <BackgroundControls form={form} onUpdate={onChange} projectId={projectId} selectedNode={selectedNode} />
      </InspectorSection>

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

      <InspectorSection title="Border" keywords="radius width color outline">
        <BorderControls form={form} onUpdate={onChange} />
      </InspectorSection>

      <InspectorSection title="Shadow & opacity" keywords="box shadow opacity">
        <EffectsControls form={form} onUpdate={onChange} selectedNode={selectedNode} />
      </InspectorSection>

      <TransformEffectsControls form={form} onUpdate={onChange} />

      {selectedNode.nodeType === 'menu' ? (
        <InspectorSection title="Menu" keywords="navigation links">
          <MenuControls form={form} onUpdate={onChange} />
        </InspectorSection>
      ) : null}
    </InspectorPanel>
  );
}
