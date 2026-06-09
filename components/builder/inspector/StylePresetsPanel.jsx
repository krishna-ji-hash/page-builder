'use client';

import { InspectorChipGrid, InspectorSection } from './InspectorUi';
import {
  CARD_STYLE_PRESETS,
  SECTION_STYLE_PRESETS,
  TEXT_STYLE_PRESETS,
  presetPatchForNodeType,
} from '@/lib/stylePresets';
import {
  buttonPresetLabel,
  listButtonPresetIds,
} from '@/lib/buttonStylePresets';

export default function StylePresetsPanel({ selectedNode, onApplyPreset, onResetButtonStyle, disabled }) {
  if (!selectedNode || typeof onApplyPreset !== 'function') return null;

  const nt = selectedNode.nodeType;
  const buttonPresets = nt === 'button' ? listButtonPresetIds() : [];
  const cardPresets =
    nt === 'content_card' || nt === 'stack' ? Object.keys(CARD_STYLE_PRESETS) : [];
  const sectionPresets = nt === 'row' ? Object.keys(SECTION_STYLE_PRESETS) : [];
  const textPresets =
    nt === 'heading' || nt === 'text' || nt === 'rich_text' ? Object.keys(TEXT_STYLE_PRESETS) : [];

  if (!buttonPresets.length && !cardPresets.length && !sectionPresets.length && !textPresets.length) {
    return (
      <InspectorSection title="Presets" defaultOpen={false} keywords="preset style">
        <p className="bld-field-note" style={{ margin: 0 }}>
          No presets for this element type. Select a button, card, section row, or text block.
        </p>
      </InspectorSection>
    );
  }

  const chip = (category, id, label) => ({
    id: `${category}-${id}`,
    label,
    disabled,
    title: label,
    onClick: () => {
      const patch = presetPatchForNodeType(nt, category, id);
      if (patch) onApplyPreset(patch);
    },
  });

  return (
    <InspectorSection title="Style presets" defaultOpen keywords="preset primary outline glass gradient reset">
      {buttonPresets.length ? (
        <>
          <div className="bld-field-label-row" style={{ marginBottom: 6 }}>
            <p className="bld-label" style={{ margin: 0 }}>
              Buttons
            </p>
            {typeof onResetButtonStyle === 'function' ? (
              <button
                type="button"
                className="bld-btn-reset bld-inspector-pro__reset"
                disabled={disabled}
                title="Reset button colors, background, border, shadow, and padding to theme defaults"
                onClick={onResetButtonStyle}
              >
                ↺ Reset
              </button>
            ) : null}
          </div>
          <InspectorChipGrid
            items={buttonPresets.map((id) => chip('button', id, buttonPresetLabel(id)))}
          />
        </>
      ) : null}
      {cardPresets.length ? (
        <>
          <p className="bld-label" style={{ margin: '12px 0 6px' }}>
            Cards
          </p>
          <InspectorChipGrid items={cardPresets.map((id) => chip('card', id, id.replace(/([A-Z])/g, ' $1').trim()))} />
        </>
      ) : null}
      {sectionPresets.length ? (
        <>
          <p className="bld-label" style={{ margin: '12px 0 6px' }}>
            Sections
          </p>
          <InspectorChipGrid
            items={sectionPresets.map((id) => chip('section', id, id.replace(/([A-Z])/g, ' $1').trim()))}
          />
        </>
      ) : null}
      {textPresets.length ? (
        <>
          <p className="bld-label" style={{ margin: '12px 0 6px' }}>
            Text
          </p>
          <InspectorChipGrid items={textPresets.map((id) => chip('text', id, id.replace(/([A-Z])/g, ' $1').trim()))} />
        </>
      ) : null}
    </InspectorSection>
  );
}
