'use client';

import { useMemo } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { InspectorField, InspectorPanel, InspectorSection } from './InspectorUi';
import {
  ANIMATION_PRESET_GROUPS,
  ANIMATION_TRIGGER_OPTIONS,
  DEFAULT_ENTRANCE_ANIMATION_PRESET,
  normalizeAnimationPreset,
} from '@/lib/interactionAnimations';
import { PARALLAX_DIRECTIONS } from '@/lib/interactionParallax';
import {
  clearInteractionGroup,
  enableEntranceAnimation,
  mergeInteractionsPatch,
} from '@/lib/interactionInspectorUtils';
import { getNodeCapabilities } from '@/lib/nodeCapabilities';
import { normalizeAnimationPresets, customAnimationPresets } from '@/lib/animationPresetsStore';
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
  onInteractionReplace,
  onInteractionClearGroup,
  onApplyToAllPageSections,
  isApplyingToAllPageSections = false,
  pageSectionCount = 0,
  disabled,
  sectionLocked = false,
  selectedNodeId,
  nodeType = 'widget',
  device = 'desktop',
}) {
  if (!selectedNodeId) {
    return (
      <InspectorPanel title="Interactions">
        <p className="bld-field-note" style={{ margin: 0 }}>
          Pehle canvas par koi <strong>Section</strong>, heading, ya element select karo — tab animation
          settings yahan dikhengi.
        </p>
      </InspectorPanel>
    );
  }

  const caps = getNodeCapabilities(nodeType);
  const { animationPresets } = useBuilderTheme();
  const projectPresets = useMemo(() => customAnimationPresets(animationPresets), [animationPresets]);
  const ix = readIx(form);
  const hover = ix.hover || {};
  const pressed = ix.pressed || ix.active || {};
  const focus = ix.focus || {};
  const anim = ix.animation || {};
  const parallax = ix.parallax || {};
  const animPreset = normalizeAnimationPreset(anim.preset);
  const animEnabled = animPreset !== 'none';
  const canApplyToAllSections = animEnabled && pageSectionCount > 0;
  const parallaxEnabled = Boolean(parallax.enabled);
  const presetRef = String(anim.presetRef || '').trim();

  const patchHover = (key, value) => onInteractionChange?.('hover', key, value);
  const patchPressed = (key, value) => onInteractionChange?.('pressed', key, value);
  const patchFocus = (key, value) => onInteractionChange?.('focus', key, value);
  const patchAnim = (key, value) => onInteractionChange?.('animation', key, value);
  const patchParallax = (key, value) => onInteractionChange?.('parallax', key, value);

  const applyProjectPreset = (id) => {
    const found = projectPresets.find((p) => p.id === id);
    if (!found) return;
    const animPatch = {
      presetRef: id,
      preset: found.animation?.preset || 'fade-in',
      trigger: found.animation?.trigger || 'on-enter-viewport',
      duration: found.animation?.duration ?? 0.6,
    };
    if (found.animation?.delay != null) animPatch.delay = found.animation.delay;
    if (found.animation?.easing) animPatch.easing = found.animation.easing;
    if (found.animation?.loop) animPatch.loop = true;
    if (found.animation?.repeat != null) animPatch.repeat = found.animation.repeat;
    onInteractionReplace?.(mergeInteractionsPatch(ix, { animation: animPatch }));
  };

  const clearGroup = (group) => {
    if (typeof onInteractionClearGroup === 'function') {
      onInteractionClearGroup(group);
      return;
    }
    if (group === 'animation') {
      onInteractionChange?.('animation', 'preset', 'none');
    }
    if (group === 'parallax') {
      onInteractionChange?.('parallax', 'enabled', false);
    }
  };

  return (
    <InspectorPanel title="Interactions">
      {disabled ? (
        <p className="bld-field-note" style={{ marginTop: 0, color: '#ef4444' }}>
          Linked global section — edit animations in <strong>Edit Global</strong> ya pehle <strong>Detach</strong>{' '}
          karo.
        </p>
      ) : null}
      {sectionLocked && !disabled ? (
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Section <strong>locked</strong> hai (layout edit band), lekin <strong>animations yahan set ho sakti hain</strong>.
          Left panel → Layers → lock icon se unlock bhi kar sakte ho.
        </p>
      ) : null}
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Animations use <strong>transform</strong> and <strong>opacity</strong> only. Tablet/mobile layers override
        duration, delay, trigger, and repeat without replacing the whole animation block.
      </p>
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Editing device: <strong>{device}</strong>
      </p>

      {pageSectionCount > 1 ? (
        <div className="bld-field" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className="bld-chip"
            disabled={disabled || !canApplyToAllSections || isApplyingToAllPageSections}
            onClick={() => void onApplyToAllPageSections?.()}
          >
            {isApplyingToAllPageSections
              ? 'Applying…'
              : `Apply animation to all ${pageSectionCount} page sections`}
          </button>
          <p className="bld-field-note" style={{ margin: '8px 0 0' }}>
            Pehle ek section par animation set karo, phir yeh button sab root sections par same animation (+ parallax
            agar ON ho) laga dega.
          </p>
        </div>
      ) : null}

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
                onInteractionReplace?.(
                  mergeInteractionsPatch(ix, { animation: { ...anim, presetRef: '' } })
                );
                return;
              }
              applyProjectPreset(id);
            }}
          >
            <option value="">— Custom per node —</option>
            {projectPresets.length ? (
              projectPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No custom project presets yet
              </option>
            )}
          </select>
        </InspectorField>

        <InspectorField label="Animation preset" disabled={disabled}>
          <select
            className="bld-input"
            value={animPreset}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.value;
              if (next === 'none') {
                onInteractionReplace?.(clearInteractionGroup(ix, 'animation'));
                return;
              }
              onInteractionReplace?.(
                enableEntranceAnimation(ix, next, {
                  duration: anim.duration ?? 0.6,
                  delay: anim.delay,
                  easing: anim.easing,
                  presetRef: anim.presetRef,
                })
              );
            }}
          >
            <option value="none">None</option>
            <option value={DEFAULT_ENTRANCE_ANIMATION_PRESET}>Fade in up (recommended)</option>
            {ANIMATION_PRESET_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.presets
                  .filter((p) => p.id !== DEFAULT_ENTRANCE_ANIMATION_PRESET)
                  .map((p) => (
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
                value={anim.trigger || 'on-enter-viewport'}
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

      {caps.supportsParallax ? (
        <InspectorSection title="Parallax" keywords="parallax scroll depth motion">
          <InspectorField label="Enable parallax" disabled={disabled}>
            <label className="bld-checkbox-row">
              <input
                type="checkbox"
                checked={parallaxEnabled}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    onInteractionReplace?.(
                      mergeInteractionsPatch(ix, {
                        parallax: {
                          enabled: true,
                          speed: parallax.speed ?? 0.35,
                          direction: parallax.direction || 'vertical-up',
                        },
                      })
                    );
                  } else {
                    onInteractionReplace?.(clearInteractionGroup(ix, 'parallax'));
                  }
                }}
              />
              <span>Move on scroll (transform only)</span>
            </label>
          </InspectorField>
          {parallaxEnabled ? (
            <>
              <InspectorField label="Direction" disabled={disabled}>
                <select
                  className="bld-input"
                  value={parallax.direction || 'vertical-up'}
                  disabled={disabled}
                  onChange={(e) => patchParallax('direction', e.target.value)}
                >
                  {PARALLAX_DIRECTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </InspectorField>
              <InspectorField label="Speed" hint="0.05 – 1" disabled={disabled}>
                <InspectorNumInput
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={parallax.speed ?? 0.35}
                  disabled={disabled}
                  onChange={(n) => patchParallax('speed', n == null ? '0.35' : String(n))}
                />
              </InspectorField>
              <button type="button" className="bld-chip" disabled={disabled} onClick={() => clearGroup('parallax')}>
                Disable parallax
              </button>
            </>
          ) : (
            <p className="bld-field-note" style={{ margin: 0 }}>
              Parallax applies to row, column, stack, and image nodes. Disabled automatically when{' '}
              <code>prefers-reduced-motion</code> is on.
            </p>
          )}
        </InspectorSection>
      ) : null}
    </InspectorPanel>
  );
}
