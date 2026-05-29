'use client';

import { useMemo, useState } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { InspectorField, InspectorSection } from './InspectorUi';
import {
  duplicateAnimationPreset,
  deleteAnimationPreset,
  normalizeAnimationPresets,
  upsertAnimationPreset,
} from '@/lib/animationPresetsStore';
import { ANIMATION_PRESET_GROUPS, ANIMATION_TRIGGER_OPTIONS } from '@/lib/interactionAnimations';
import { InspectorNumInput } from '@/components/builder/inspector/InspectorNumeric';

export default function ProjectAnimationPresetsPanel({ disabled }) {
  const { animationPresets, setAnimationPresets, animationPresetsPersist } = useBuilderTheme();
  const normalized = useMemo(() => normalizeAnimationPresets(animationPresets), [animationPresets]);
  const presets = normalized.presets || [];
  const [activeId, setActiveId] = useState('');
  const active = presets.find((p) => p.id === activeId) || presets[0] || null;

  const patchActive = (patch) => {
    if (!active) return;
    setAnimationPresets((prev) =>
      upsertAnimationPreset(prev, {
        ...active,
        ...patch,
        animation: { ...active.animation, ...(patch.animation || {}) },
      })
    );
  };

  const createPreset = () => {
    const id = `anim-${Date.now().toString(36)}`;
    setAnimationPresets((prev) =>
      upsertAnimationPreset(prev, {
        id,
        name: 'New animation',
        builtin: false,
        animation: {
          preset: 'fade-in',
          duration: 0.6,
          delay: 0,
          easing: 'ease-out',
          trigger: 'on-enter-viewport',
          repeat: 1,
        },
      })
    );
    setActiveId(id);
  };

  return (
    <InspectorSection title="Project animation presets" keywords="global preset library">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Stored on <strong>projects.config_json.animationPresets</strong>. Nodes can reference a preset via{' '}
        <code>presetRef</code> and override duration/delay per device.
      </p>
      {animationPresetsPersist?.status === 'error' ? (
        <p className="bld-field-note" style={{ color: '#ef4444' }}>
          Save failed: {animationPresetsPersist.error}
        </p>
      ) : null}
      <div className="bld-field" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <button type="button" className="bld-chip" disabled={disabled} onClick={createPreset}>
          Create preset
        </button>
        <button
          type="button"
          className="bld-chip"
          disabled={disabled || !active}
          onClick={() => {
            if (!active) return;
            setAnimationPresets((prev) => duplicateAnimationPreset(prev, active.id));
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="bld-chip"
          disabled={disabled || !active || active.builtin}
          onClick={() => {
            if (!active || active.builtin) return;
            setAnimationPresets((prev) => deleteAnimationPreset(prev, active.id));
            setActiveId('');
          }}
        >
          Delete
        </button>
      </div>
      <InspectorField label="Preset" disabled={disabled}>
        <select
          className="bld-input"
          value={active?.id || ''}
          disabled={disabled}
          onChange={(e) => setActiveId(e.target.value)}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.builtin ? ' (built-in)' : ''}
            </option>
          ))}
        </select>
      </InspectorField>
      {active ? (
        <>
          <InspectorField label="Name" disabled={disabled || active.builtin}>
            <input
              className="bld-input"
              value={active.name}
              disabled={disabled || active.builtin}
              onChange={(e) => patchActive({ name: e.target.value })}
            />
          </InspectorField>
          <InspectorField label="Animation type" disabled={disabled}>
            <select
              className="bld-input"
              value={active.animation?.preset || 'fade-in'}
              disabled={disabled}
              onChange={(e) => patchActive({ animation: { preset: e.target.value } })}
            >
              {ANIMATION_PRESET_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </InspectorField>
          <InspectorField label="Trigger" disabled={disabled}>
            <select
              className="bld-input"
              value={active.animation?.trigger || 'on-enter-viewport'}
              disabled={disabled}
              onChange={(e) => patchActive({ animation: { trigger: e.target.value } })}
            >
              {ANIMATION_TRIGGER_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </InspectorField>
          <div className="bld-field-grid">
            <InspectorField label="Duration (s)" disabled={disabled}>
              <InspectorNumInput
                min={0}
                max={120}
                step={0.1}
                value={active.animation?.duration ?? 0.6}
                disabled={disabled}
                onChange={(n) => patchActive({ animation: { duration: n ?? 0.6 } })}
              />
            </InspectorField>
            <InspectorField label="Delay (s)" disabled={disabled}>
              <InspectorNumInput
                min={0}
                max={120}
                step={0.1}
                value={active.animation?.delay ?? 0}
                disabled={disabled}
                onChange={(n) => patchActive({ animation: { delay: n ?? 0 } })}
              />
            </InspectorField>
            <InspectorField label="Repeat" disabled={disabled}>
              <InspectorNumInput
                min={1}
                max={99}
                step={1}
                value={active.animation?.repeat ?? 1}
                disabled={disabled || active.animation?.loop}
                onChange={(n) => patchActive({ animation: { repeat: n ?? 1, loop: false } })}
              />
            </InspectorField>
          </div>
        </>
      ) : null}
    </InspectorSection>
  );
}
