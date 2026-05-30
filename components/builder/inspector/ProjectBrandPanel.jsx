'use client';

import { useMemo } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import FontFamilySelect from '@/components/builder/inspector/FontFamilySelect';
import { resolveFontStack } from '@/lib/fontPresets';
import {
  syncBrandColorsToThemeTokens,
  syncBrandFontToThemeTokens,
} from '@/lib/projectBrand';

function ColorField({ id, label, value, onChange }) {
  const hex = String(value || '').trim();
  const safe = /^#[0-9a-fA-F]{6}$/i.test(hex) ? hex : '#000000';
  return (
    <div className="bld-project-brand__color">
      <label className="bld-project-brand__color-label" htmlFor={id}>
        {label}
      </label>
      <div className="bld-project-brand__color-inputs">
        <input
          id={id}
          type="color"
          className="bld-project-brand__swatch"
          aria-label={label}
          value={safe}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="bld-input bld-project-brand__hex"
          value={hex}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/**
 * Project-wide brand controls: theme mode, colors, unified font, apply font to page.
 * @param {object} props
 * @param {() => Promise<void>} [props.onApplyFontsToPage]
 * @param {boolean} [props.isApplyingFonts]
 * @param {number} [props.explicitFontOverrideCount]
 */
export default function ProjectBrandPanel({
  onApplyFontsToPage,
  isApplyingFonts = false,
  explicitFontOverrideCount = 0,
}) {
  const {
    siteTheme,
    setSiteTheme,
    applySitePreset,
    siteThemePersist,
    setThemeTokens,
    themeTokensPersist,
  } = useBuilderTheme();
  const { colors, typography } = siteTheme;

  const resolvedFont = useMemo(
    () => resolveFontStack(typography.fontFamily),
    [typography.fontFamily]
  );

  const patchColors = (key, val) => {
    setSiteTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: val } }));
    setThemeTokens((prev) => syncBrandColorsToThemeTokens(prev, { [key]: val }));
  };

  const applyProjectFont = (stack) => {
    const resolved = resolveFontStack(stack);
    setSiteTheme((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontFamily: resolved,
        fontFamilyHeading: resolved,
      },
    }));
    setThemeTokens((prev) => syncBrandFontToThemeTokens(prev, resolved));
  };

  const saving =
    siteThemePersist.status === 'saving' ||
    themeTokensPersist?.status === 'saving';

  return (
    <div className="bld-project-brand">
      <div className="bld-project-brand__head">
        <h2 className="bld-project-brand__title">Project brand</h2>
        <p className="bld-project-brand__lead">
          Theme color, text color, and font apply across builder canvas, preview, and published site.
        </p>
        {saving ? <p className="bld-project-brand__status">Saving…</p> : null}
        {siteThemePersist.status === 'error' ? (
          <p className="bld-project-brand__status" style={{ color: '#ef4444' }}>
            Save failed: {siteThemePersist.error || 'Could not save to database. Try again in a moment.'}
          </p>
        ) : null}
        {themeTokensPersist?.status === 'error' ? (
          <p className="bld-project-brand__status" style={{ color: '#ef4444' }}>
            Theme tokens save failed: {themeTokensPersist.error || 'Database busy — retry shortly.'}
          </p>
        ) : null}
        {siteThemePersist.status === 'saved' || themeTokensPersist?.status === 'saved' ? (
          <p className="bld-project-brand__status bld-project-brand__status--ok">Saved to project</p>
        ) : null}
      </div>

      <div className="bld-project-brand__section">
        <div className="bld-project-brand__section-title">Site mode</div>
        <div className="bld-tiny-toggle">
          <button
            type="button"
            className={`bld-tiny-toggle__btn ${siteTheme.presetId === 'light' ? 'is-active' : ''}`}
            onClick={() => applySitePreset('light')}
          >
            Light
          </button>
          <button
            type="button"
            className={`bld-tiny-toggle__btn ${siteTheme.presetId === 'dark' ? 'is-active' : ''}`}
            onClick={() => applySitePreset('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="bld-project-brand__section">
        <div className="bld-project-brand__section-title">Brand colors</div>
        <ColorField id="brand-primary" label="Theme / primary" value={colors.primary} onChange={(v) => patchColors('primary', v)} />
        <ColorField id="brand-text" label="Text" value={colors.text} onChange={(v) => patchColors('text', v)} />
        <ColorField id="brand-muted" label="Muted text" value={colors.muted} onChange={(v) => patchColors('muted', v)} />
        <ColorField id="brand-bg" label="Page background" value={colors.background} onChange={(v) => patchColors('background', v)} />
      </div>

      <div className="bld-project-brand__section">
        <div className="bld-project-brand__section-title">Font family</div>
        <p className="bld-project-brand__hint">
          Project font applies instantly on canvas — even inside locked sections. Template fonts (e.g. Georgia) no
          longer block your brand font.
        </p>
        <div className="bld-field">
          <label className="bld-label" htmlFor="brand-font-family">
            Project font
          </label>
          <FontFamilySelect
            id="brand-font-family"
            value={typography.fontFamily}
            onChange={(stack) => applyProjectFont(stack)}
          />
        </div>
        <div className="bld-project-brand__font-preview" style={{ fontFamily: resolvedFont }}>
          <div className="bld-project-brand__font-preview-heading">Heading preview</div>
          <div className="bld-project-brand__font-preview-body">
            Body text preview — quick brown fox jumps over the lazy dog.
          </div>
        </div>
        {typeof onApplyFontsToPage === 'function' ? (
          <div className="bld-project-brand__apply-font">
            {explicitFontOverrideCount > 0 ? (
              <p className="bld-project-brand__hint">
                {explicitFontOverrideCount} widget{explicitFontOverrideCount === 1 ? '' : 's'} use a custom font set in
                Style → Typography. Optional: reset them to the project font.
              </p>
            ) : (
              <p className="bld-project-brand__hint">All widgets use the project font.</p>
            )}
            <button
              type="button"
              className="bld-btn bld-btn--secondary bld-project-brand__apply-btn"
              disabled={isApplyingFonts || explicitFontOverrideCount === 0}
              onClick={() => void onApplyFontsToPage()}
            >
              {isApplyingFonts ? 'Saving…' : 'Reset custom widget fonts'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
