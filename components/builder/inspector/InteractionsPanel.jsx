'use client';

import { InspectorField, InspectorPanel, InspectorSection } from './InspectorUi';
import { ANIMATION_PRESET_GROUPS, normalizeAnimationPreset } from '@/lib/interactionAnimations';
import { sanitizeCssColor } from '@/lib/inspectorStyleValidate';

const ANIM_TRIGGERS = [
  { id: 'on-load', label: 'On load (page open)' },
  { id: 'on-hover', label: 'On mouse hover' },
  { id: 'on-scroll', label: 'On scroll (into view)' },
];

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
}) {
  const ix = readIx(form);
  const hover = ix.hover || {};
  const active = ix.active || {};
  const focus = ix.focus || {};
  const anim = ix.animation || {};
  const animPreset = normalizeAnimationPreset(anim.preset);
  const animEnabled = animPreset !== 'none';

  const patchHover = (key, value) => onInteractionChange?.('hover', key, value);
  const patchActive = (key, value) => onInteractionChange?.('active', key, value);
  const patchFocus = (key, value) => onInteractionChange?.('focus', key, value);
  const patchAnim = (key, value) => onInteractionChange?.('animation', key, value);

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
        <strong>Mouse hover</strong> and <strong>mouse click</strong> styles apply instantly on the canvas.{' '}
        <strong>Animation</strong> uses the trigger you pick (load, hover, or scroll into view).
      </p>

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
            <input
              className="bld-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={hover.opacity ?? ''}
              disabled={disabled}
              placeholder="1"
              onChange={(e) => patchHover('opacity', e.target.value)}
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
        key={selectedNodeId ? `ix-click-${selectedNodeId}` : 'ix-click'}
        title="Mouse click"
        defaultOpen
        keywords="mouse click active pressed pointer down"
      >
        <div className="bld-field" style={{ marginBottom: 8 }}>
          <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('active')}>
            Clear click styles
          </button>
        </div>
        <div className="bld-field-grid">
          <InspectorField label="Scale" hint="e.g. 0.98" disabled={disabled}>
            <input
              className="bld-input"
              value={active.scale ?? ''}
              disabled={disabled}
              placeholder="0.98"
              onChange={(e) => patchActive('scale', e.target.value)}
            />
          </InspectorField>
          <InspectorField label="Background" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(active.background, '#4f46e5')}
              disabled={disabled}
              onChange={(e) => patchActive('background', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Text color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(active.textColor, '#ffffff')}
              disabled={disabled}
              onChange={(e) => patchActive('textColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Border color" disabled={disabled}>
            <input
              className="bld-input"
              type="color"
              value={colorInputValue(active.borderColor, '#4338ca')}
              disabled={disabled}
              onChange={(e) => patchActive('borderColor', sanitizeCssColor(e.target.value))}
            />
          </InspectorField>
          <InspectorField label="Opacity" disabled={disabled}>
            <input
              className="bld-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={active.opacity ?? ''}
              disabled={disabled}
              placeholder="1"
              onChange={(e) => patchActive('opacity', e.target.value)}
            />
          </InspectorField>
        </div>
        <InspectorField label="Shadow" disabled={disabled}>
          <input
            className="bld-input"
            value={active.boxShadow ?? ''}
            disabled={disabled}
            placeholder="none"
            onChange={(e) => patchActive('boxShadow', e.target.value)}
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
        <InspectorField label="Animation type" disabled={disabled}>
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
            <InspectorField label="When to play" disabled={disabled}>
              <select
                className="bld-input"
                value={anim.trigger || 'on-load'}
                disabled={disabled}
                onChange={(e) => patchAnim('trigger', e.target.value)}
              >
                {ANIM_TRIGGERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </InspectorField>
            <p className="bld-field-note" style={{ marginTop: 0 }}>
              <strong>On load</strong> — plays when the page opens. <strong>On mouse hover</strong> — plays while the
              pointer is over the element. <strong>On scroll</strong> — plays when the element scrolls into view (scroll
              the canvas or live page to preview).
            </p>
            <div className="bld-field-grid">
              <InspectorField label="Duration (s)" disabled={disabled}>
                <input
                  className="bld-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={anim.duration ?? 0.6}
                  disabled={disabled}
                  onChange={(e) => patchAnim('duration', e.target.value)}
                />
              </InspectorField>
              <InspectorField label="Delay (s)" disabled={disabled}>
                <input
                  className="bld-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={anim.delay ?? 0}
                  disabled={disabled}
                  onChange={(e) => patchAnim('delay', e.target.value)}
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
              <InspectorField label="Loop" disabled={disabled}>
                <label className="bld-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(anim.loop)}
                    disabled={disabled}
                    onChange={(e) => patchAnim('loop', e.target.checked)}
                  />
                  <span>Repeat</span>
                </label>
              </InspectorField>
            </div>
            <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('animation')}>
              Remove animation
            </button>
          </>
        ) : (
          <p className="bld-field-note" style={{ margin: 0 }}>
            Pick an animation (slide from top/left/right, zoom in/out, fade, …) then <strong>when to play</strong>: on load,
            mouse hover, or scroll into view.
          </p>
        )}
      </InspectorSection>
    </InspectorPanel>
  );
}
