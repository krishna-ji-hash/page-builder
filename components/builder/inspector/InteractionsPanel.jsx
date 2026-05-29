'use client';

import { useMemo } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { InspectorField, InspectorPanel, InspectorSection } from './InspectorUi';
import {
  ANIMATION_PRESET_GROUPS,
  ANIMATION_TRIGGER_OPTIONS,
  normalizeAnimationPreset,
} from '@/lib/interactionAnimations';
import { normalizeAnimationPresets } from '@/lib/animationPresetsStore';
import { InspectorNumInput } from '@/components/builder/inspector/InspectorNumeric';
import { sanitizeCssColor } from '@/lib/inspectorStyleValidate';
import ProjectAnimationPresetsPanel from './ProjectAnimationPresetsPanel';

const EASING_OPTIONS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier(0.34, 1.56, 0.64, 1)'];

function readIx(form) {
  return form?.interactions && typeof form.interactions === 'object' ? form.interactions : {};
}

function colorInputValue(stored, fallback = '#6366f1') {
  const s = String(stored ?? '').trim();
  if (s.startsWith('#') && (s.length === 4 || s.length === 7)) return s;
  return fallback;
}

export default function InteractionsPanel({
  form,
  onInteractionChange,
  onInteractionClearGroup,
  disabled,
  selectedNodeId,
  device = 'desktop',
}) {
  const { animationPresets } = useBuilderTheme();
  const projectPresets = useMemo(
    () => normalizeAnimationPresets(animationPresets).presets || [],
    [animationPresets]
  );
  const ix = readIx(form);
  const hover = ix.hover || {};
  const pressed = ix.pressed || ix.active || {};
  const focus = ix.focus || {};
  const anim = ix.animation || {};
  const animPreset = normalizeAnimationPreset(anim.preset);
  const animEnabled = animPreset !== 'none';
  const presetRef = String(anim.presetRef || '').trim();

  const patchHover = (key, value) => onInteractionChange?.('hover', key, value);
  const patchPressed = (key, value) => onInteractionChange?.('pressed', key, value);
  const patchFocus = (key, value) => onInteractionChange?.('focus', key, value);
  const patchAnim = (key, value) => onInteractionChange?.('animation', key, value);

  const applyProjectPreset = (id) => {
    const found = projectPresets.find((p) => p.id === id);
    if (!found) return;
    onInteractionChange?.('animation', 'presetRef', id);
    onInteractionChange?.('animation', 'preset', found.animation?.preset || 'fade-in');
    if (found.animation?.trigger) onInteractionChange?.('animation', 'trigger', found.animation.trigger);
    if (found.animation?.duration != null) onInteractionChange?.('animation', 'duration', String(found.animation.duration));
    if (found.animation?.delay != null) onInteractionChange?.('animation', 'delay', String(found.animation.delay));
    if (found.animation?.easing) onInteractionChange?.('animation', 'easing', found.animation.easing);
    if (found.animation?.loop) onInteractionChange?.('animation', 'loop', true);
    if (found.animation?.repeat != null) onInteractionChange?.('animation', 'repeat', String(found.animation.repeat));
  };

  const clearGroup = (group) => {
    if (typeof onInteractionClearGroup === 'function') {
      onInteractionClearGroup(group);
      return;
    }
    if (group === 'animation') {
      onInteractionChange?.('animation', 'preset', 'none');
    }
  };

  return (
    <InspectorPanel title="Interactions">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Animations use <strong>transform</strong> and <strong>opacity</strong> only. Tablet/mobile layers override
        duration, delay, trigger, and repeat without replacing the whole animation block.
      </p>
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Editing device: <strong>{device}</strong>
      </p>

      <ProjectAnimationPresetsPanel disabled={disabled} />

      <InspectorSection
        key={selectedNodeId ? `ix-hover-${selectedNodeId}` : 'ix-hover'}
        title="Mouse hover"
        defaultOpen
        keywords="mouse hover pointer cursor"
      >
        <div className="bld-field" style={{ marginBottom: 8 }}>
          <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('hover')}>
            Clear hover styles
          </button>
        </div>
        <div className="bld-field-grid">
          <InspectorField label="Background" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(hover.background)}
              disabled={disabled}
              onChange={(e) => patchHover('background', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Text color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(hover.textColor, '#ffffff')}
              disabled={disabled}
              onChange={(e) => patchHover('textColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Border color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(hover.borderColor)}
              disabled={disabled}
              onChange={(e) => patchHover('borderColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Scale" hint="e.g. 1.03" disabled={disabled}>
            <input
              className="bld-input"
              value={hover.scale ?? ''}
              disabled={disabled}
              placeholder="1"
              onChange={(e) => patchHover('scale', e.target.value)}
            />
          </InspectorField>
          <InspectorField label="Move Y" hint="e.g. -4px" disabled={disabled}>
            <input
              className="bld-input"
              value={hover.translateY ?? ''}
              disabled={disabled}
              placeholder="0px"
              onChange={(e) => patchHover('translateY', e.target.value)}
            />
          </InspectorField>
          <InspectorField label="Opacity" disabled={disabled}>
            <InspectorNumInput
              min={0}
              max={1}
              step={0.05}
              value={hover.opacity ?? ''}
              disabled={disabled}
              placeholder="1"
              onChange={(n) => patchHover('opacity', n == null ? '' : String(n))}
            />
          </InspectorField>
        </div>
        <InspectorField label="Box shadow" disabled={disabled}>
          <input
            className="bld-input"
            value={hover.boxShadow ?? ''}
            disabled={disabled}
            placeholder="0 8px 24px rgba(0,0,0,0.12)"
            onChange={(e) => patchHover('boxShadow', e.target.value)}
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection
        key={selectedNodeId ? `ix-pressed-${selectedNodeId}` : 'ix-pressed'}
        title="Pressed"
        defaultOpen
        keywords="pressed active click pointer down"
      >
        <div className="bld-field" style={{ marginBottom: 8 }}>
          <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('pressed')}>
            Clear pressed styles
          </button>
        </div>
        <div className="bld-field-grid">
          <InspectorField label="Scale" hint="e.g. 0.98" disabled={disabled}>
            <input
              className="bld-input"
              value={pressed.scale ?? ''}
              disabled={disabled}
              placeholder="0.98"
              onChange={(e) => patchPressed('scale', e.target.value)}
            />
          </InspectorField>
          <InspectorField label="Background" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(pressed.background, '#4f46e5')}
              disabled={disabled}
              onChange={(e) => patchPressed('background', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Text color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(pressed.textColor, '#ffffff')}
              disabled={disabled}
              onChange={(e) => patchPressed('textColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Border color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(pressed.borderColor, '#4338ca')}
              disabled={disabled}
              onChange={(e) => patchPressed('borderColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Opacity" disabled={disabled}>
            <InspectorNumInput
              min={0}
              max={1}
              step={0.05}
              value={pressed.opacity ?? ''}
              disabled={disabled}
              placeholder="1"
              onChange={(n) => patchPressed('opacity', n == null ? '' : String(n))}
            />
          </InspectorField>
        </div>
        <InspectorField label="Shadow" disabled={disabled}>
          <input
            className="bld-input"
            value={pressed.boxShadow ?? ''}
            disabled={disabled}
            placeholder="none"
            onChange={(e) => patchPressed('boxShadow', e.target.value)}
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Keyboard focus" keywords="focus accessibility ring outline tab">
        <div className="bld-field" style={{ marginBottom: 8 }}>
          <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('focus')}>
            Clear focus styles
          </button>
        </div>
        <InspectorField label="Outline" disabled={disabled}>
          <input
            className="bld-input"
            value={focus.outline ?? ''}
            disabled={disabled}
            placeholder="2px solid #6366f1"
            onChange={(e) => patchFocus('outline', e.target.value)}
          />
        </InspectorField>
        <InspectorField label="Focus ring color" disabled={disabled}>
          <input
            className="bld-input"
            type="color"
            value={colorInputValue(focus.ringColor)}
            disabled={disabled}
            onChange={(e) => patchFocus('ringColor', sanitizeCssColor(e.target.value))}
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Animation" keywords="animation fade slide scroll hover load">
        <InspectorField label="Project preset (optional)" disabled={disabled}>
          <select
            className="bld-input"
            value={presetRef}
            disabled={disabled}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                onInteractionChange?.('animation', 'presetRef', '');
                return;
              }
              applyProjectPreset(id);
            }}
          >
            <option value="">— Custom per node —</option>
            {projectPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </InspectorField>

        <InspectorField label="Animation preset" disabled={disabled}>
          <select
            className="bld-input"
            value={animPreset}
            disabled={disabled}
            onChange={(e) => patchAnim('preset', e.target.value)}
          >
            <option value="none">None</option>
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

        {animEnabled ? (
          <>
            <InspectorField label="Trigger" disabled={disabled}>
              <select
                className="bld-input"
                value={anim.trigger || 'on-load'}
                disabled={disabled}
                onChange={(e) => patchAnim('trigger', e.target.value)}
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
                  value={anim.duration ?? 0.6}
                  disabled={disabled}
                  onChange={(n) => patchAnim('duration', n == null ? '' : String(n))}
                />
              </InspectorField>
              <InspectorField label="Delay (s)" disabled={disabled}>
                <InspectorNumInput
                  min={0}
                  max={120}
                  step={0.1}
                  value={anim.delay ?? 0}
                  disabled={disabled}
                  onChange={(n) => patchAnim('delay', n == null ? '' : String(n))}
                />
              </InspectorField>
              <InspectorField label="Easing" disabled={disabled}>
                <select
                  className="bld-input"
                  value={anim.easing || 'ease'}
                  disabled={disabled}
                  onChange={(e) => patchAnim('easing', e.target.value)}
                >
                  {EASING_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </InspectorField>
              <InspectorField label="Repeat" disabled={disabled}>
                <InspectorNumInput
                  min={1}
                  max={99}
                  step={1}
                  value={anim.repeat ?? 1}
                  disabled={disabled || Boolean(anim.loop)}
                  onChange={(n) => {
                    patchAnim('loop', false);
                    patchAnim('repeat', n == null ? '1' : String(n));
                  }}
                />
              </InspectorField>
              <InspectorField label="Loop" disabled={disabled}>
                <label className="bld-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(anim.loop)}
                    disabled={disabled}
                    onChange={(e) => patchAnim('loop', e.target.checked)}
                  />
                  <span>Infinite repeat</span>
                </label>
              </InspectorField>
            </div>
            <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('animation')}>
              Remove animation
            </button>
          </>
        ) : (
          <p className="bld-field-note" style={{ margin: 0 }}>
            Pick a preset, trigger, duration, and easing. Scroll/viewport animations reveal when the element enters the
            viewport (builder canvas and live).
          </p>
        )}
      </InspectorSection>
    </InspectorPanel>
  );
}
