'use client';

import { useMemo, useState } from 'react';
import { InspectorNumField } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';

const IMAGE_WIDTH_STEP = 40;
const IMAGE_HEIGHT_STEP = 32;
const COL_WIDTH_STEP = 4;
const COL_HEIGHT_STEP = 24;
const OFFSET_STEP = 8;
const DEFAULT_IMAGE_WIDTH = 480;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parsePaddingYPx(styleJson) {
  const sj = styleJson && typeof styleJson === 'object' ? styleJson : {};
  const desktop = sj.desktop && typeof sj.desktop === 'object' ? sj.desktop : sj;
  const spacing = desktop.spacing && typeof desktop.spacing === 'object' ? desktop.spacing : {};
  const raw = String(spacing.padding || '').trim();
  if (!raw) return 48;
  const parts = raw.split(/\s+/).filter(Boolean);
  const px = (s) => {
    const m = String(s).match(/^([\d.]+)\s*px$/i);
    return m ? Math.round(Number(m[1])) : 0;
  };
  if (parts.length === 1) return px(parts[0]) || 48;
  if (parts.length === 2) return px(parts[0]) || px(parts[1]) || 48;
  return px(parts[0]) || 48;
}

function readPropNumber(form, selectedNode, key, fallback = 0) {
  const draft = form?.[key];
  if (draft !== undefined && draft !== '' && draft != null) {
    const n = Number(draft);
    if (Number.isFinite(n)) return n;
  }
  const n = Number(selectedNode?.props?.[key]);
  return Number.isFinite(n) ? n : fallback;
}

function NudgeButtons({ label, onMinus, onPlus }) {
  return (
    <div style={{ display: 'flex', gap: 6 }} role="group" aria-label={label}>
      <button type="button" className="bld-chip" onClick={onMinus} title="Decrease" aria-label={`Decrease ${label}`}>
        −
      </button>
      <button type="button" className="bld-chip" onClick={onPlus} title="Increase" aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  );
}

function OffsetPad({ onUp, onDown, onLeft, onRight, onReset, resetLabel }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 44px)',
        gap: 6,
        justifyContent: 'start',
        marginTop: 8,
      }}
    >
      <span />
      <button type="button" className="bld-chip" onClick={onUp} title="Up" aria-label="Up">
        ↑
      </button>
      <span />
      <button type="button" className="bld-chip" onClick={onLeft} title="Left" aria-label="Left">
        ←
      </button>
      <button type="button" className="bld-chip" onClick={onReset} title={resetLabel} aria-label={resetLabel}>
        ◎
      </button>
      <button type="button" className="bld-chip" onClick={onRight} title="Right" aria-label="Right">
        →
      </button>
      <span />
      <button type="button" className="bld-chip" onClick={onDown} title="Down" aria-label="Down">
        ↓
      </button>
      <span />
    </div>
  );
}

export default function SplitHeroImageSizeControls({
  selectedNode,
  form = {},
  slides = [],
  onChange,
  sectionRow = null,
  onPatchSectionPaddingY = null,
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const safeIdx = clamp(slideIdx, 0, Math.max(0, slides.length - 1));
  const slide = slides[safeIdx] || slides[0] || null;

  const visualWidthPct = useMemo(
    () => clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroVisualWidthPct', 40)), 28, 72),
    [form?.splitHeroVisualWidthPct, selectedNode?.props?.splitHeroVisualWidthPct]
  );
  const visualMinHeightPx = Math.max(0, Math.round(readPropNumber(form, selectedNode, 'splitHeroVisualMinHeightPx', 0)));
  const visualOffsetXPx = clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroVisualOffsetXPx', 0)), -480, 480);
  const visualOffsetYPx = clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroVisualOffsetYPx', 0)), -480, 480);
  const navOffsetXPx = clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroNavOffsetXPx', 0)), -480, 480);
  const navOffsetYPx = clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroNavOffsetYPx', 0)), -480, 480);
  const imageMaxHeightPx = Math.max(0, Math.round(readPropNumber(form, selectedNode, 'splitHeroImageMaxHeightPx', 300)));
  const imageScalePct = clamp(Math.round(readPropNumber(form, selectedNode, 'splitHeroImageScalePct', 100)), 100, 140);

  const imageWidthPx = Math.max(0, Math.round(Number(slide?.imageWidthPx) || 0));
  const imageHeightPx = Math.max(0, Math.round(Number(slide?.imageHeightPx) || 0));

  const patchSlide = (patch) => {
    if (!slide) return;
    onChange('carouselSlidePatch', { index: safeIdx, patch });
  };

  const nudgeImageWidth = (delta) => {
    const cur = imageWidthPx;
    const next =
      cur <= 0 && delta > 0
        ? DEFAULT_IMAGE_WIDTH
        : clamp((cur || DEFAULT_IMAGE_WIDTH) + delta * IMAGE_WIDTH_STEP, 0, 2400);
    patchSlide({ imageWidthPx: next });
  };

  const nudgeImageHeight = (delta) => {
    const cur = imageHeightPx;
    const next =
      cur <= 0 && delta > 0 ? 360 : clamp((cur || 360) + delta * IMAGE_HEIGHT_STEP, 0, 2400);
    patchSlide({ imageHeightPx: next });
  };

  const nudgeColumnWidth = (delta) => {
    onChange('splitHeroVisualWidthPct', String(clamp(visualWidthPct + delta * COL_WIDTH_STEP, 28, 72)));
  };

  const nudgeColumnHeight = (delta) => {
    const cur = visualMinHeightPx;
    const next = clamp(cur + delta * COL_HEIGHT_STEP, 0, 1200);
    onChange('splitHeroVisualMinHeightPx', String(next));
  };

  const nudgeOffsetX = (delta) => {
    onChange('splitHeroVisualOffsetXPx', String(clamp(visualOffsetXPx + delta * OFFSET_STEP, -480, 480)));
  };

  const nudgeOffsetY = (delta) => {
    onChange('splitHeroVisualOffsetYPx', String(clamp(visualOffsetYPx + delta * OFFSET_STEP, -480, 480)));
  };

  const nudgeNavX = (delta) => {
    onChange('splitHeroNavOffsetXPx', String(clamp(navOffsetXPx + delta * OFFSET_STEP, -480, 480)));
  };

  const nudgeNavY = (delta) => {
    onChange('splitHeroNavOffsetYPx', String(clamp(navOffsetYPx + delta * OFFSET_STEP, -480, 480)));
  };

  const nudgeImageMaxH = (delta) => {
    const base = imageMaxHeightPx > 0 ? imageMaxHeightPx : 300;
    onChange('splitHeroImageMaxHeightPx', String(clamp(base + delta * IMAGE_HEIGHT_STEP, 120, 1200)));
  };

  const sectionPaddingY =
    sectionRow?.nodeType === 'row' ? parsePaddingYPx(sectionRow.style_json) : null;

  const nudgeSectionPadding = (delta) => {
    if (typeof onPatchSectionPaddingY !== 'function' || sectionPaddingY == null) return;
    onPatchSectionPaddingY(clamp(sectionPaddingY + delta * 8, 0, 200));
  };

  return (
    <div className="bld-inspector-pro__section" style={{ marginBottom: 8 }}>
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        <strong>Move card / arrows</strong> shifts only that piece. <strong>Column min height</strong> can grow the section.
      </p>

      {sectionRow?.nodeType === 'row' ? (
        <InspectorSection title="Section spacing" keywords="padding row vertical">
          <div className="bld-field">
            <div className="bld-field-label-row">
              <label className="bld-label" htmlFor="split-hero-section-pad-y">
                Vertical padding (px)
              </label>
              <NudgeButtons label="Section padding" onMinus={() => nudgeSectionPadding(-1)} onPlus={() => nudgeSectionPadding(1)} />
            </div>
            <InspectorNumField
              id="split-hero-section-pad-y"
              label=""
              min={0}
              max={200}
              value={sectionPaddingY ?? 48}
              onChange={(n) => onPatchSectionPaddingY?.(n ?? 0)}
            />
            <p className="bld-field-note">Top and bottom padding on the parent section row (e.g. 32–48).</p>
          </div>
        </InspectorSection>
      ) : null}

      {slides.length > 1 ? (
        <InspectorSection title="Slide" defaultOpen={false} keywords="slide image">
          <div className="bld-field">
            <label className="bld-label" htmlFor="split-hero-size-slide">
              Edit slide
            </label>
            <select
              id="split-hero-size-slide"
              className="bld-input"
              value={String(safeIdx)}
              onChange={(e) => setSlideIdx(Number(e.target.value) || 0)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {slides.map((s, idx) => (
                <option key={String(s?.id || idx)} value={String(idx)}>
                  {String(s?.title || `Slide ${idx + 1}`).slice(0, 48)}
                </option>
              ))}
            </select>
          </div>
        </InspectorSection>
      ) : null}

      <InspectorSection title="Column & image" defaultOpen keywords="width height mockup">
        <div className="bld-field">
          <div className="bld-field-label-row">
            <label className="bld-label" htmlFor="split-hero-col-width">
              Right column width (%)
            </label>
            <NudgeButtons label="Column width" onMinus={() => nudgeColumnWidth(-1)} onPlus={() => nudgeColumnWidth(1)} />
          </div>
          <InspectorNumField
            id="split-hero-col-width"
            label=""
            min={28}
            max={72}
            value={visualWidthPct}
            onChange={(n) => onChange('splitHeroVisualWidthPct', String(n ?? 40))}
          />
        </div>

        <div className="bld-field">
          <div className="bld-field-label-row">
            <label className="bld-label" htmlFor="split-hero-img-max-h">
              Image max height (px)
            </label>
            <NudgeButtons label="Image max height" onMinus={() => nudgeImageMaxH(-1)} onPlus={() => nudgeImageMaxH(1)} />
          </div>
          <InspectorNumField
            id="split-hero-img-max-h"
            label=""
            min={0}
            max={1200}
            value={imageMaxHeightPx}
            placeholder="0 = no cap"
            onChange={(n) => onChange('splitHeroImageMaxHeightPx', String(n ?? 0))}
          />
          <p className="bld-field-note">Use Image fit: Contain in Content for full mockup without crop.</p>
        </div>

        <div className="bld-field">
          <div className="bld-field-label-row">
            <label className="bld-label" htmlFor="split-hero-img-scale">
              Tight crop / zoom (%)
            </label>
            <NudgeButtons
              label="Image zoom"
              onMinus={() =>
                onChange('splitHeroImageScalePct', String(clamp(imageScalePct - 2, 100, 140)))
              }
              onPlus={() =>
                onChange('splitHeroImageScalePct', String(clamp(imageScalePct + 2, 100, 140)))
              }
            />
          </div>
          <InspectorNumField
            id="split-hero-img-scale"
            label=""
            min={100}
            max={140}
            value={imageScalePct}
            onChange={(n) => onChange('splitHeroImageScalePct', String(clamp(n ?? 100, 100, 140)))}
          />
          <p className="bld-field-note">
            105–115% se image ke left/right khali margin kam dikhte hain (PNG ke andar space ho to). 100% = off.
          </p>
        </div>

        <div className="bld-field">
          <div className="bld-field-label-row">
            <label className="bld-label" htmlFor="split-hero-col-min-h">
              Right column min height (px)
            </label>
            <NudgeButtons label="Column min height" onMinus={() => nudgeColumnHeight(-1)} onPlus={() => nudgeColumnHeight(1)} />
          </div>
          <InspectorNumField
            id="split-hero-col-min-h"
            label=""
            min={0}
            max={1200}
            value={visualMinHeightPx}
            placeholder="0 = auto"
            onChange={(n) => onChange('splitHeroVisualMinHeightPx', String(n ?? 0))}
          />
        </div>

        <div className="bld-field-grid">
          <div className="bld-field">
            <div className="bld-field-label-row">
              <label className="bld-label" htmlFor="split-hero-img-w">
                Mockup width (px)
              </label>
              <NudgeButtons label="Mockup width" onMinus={() => nudgeImageWidth(-1)} onPlus={() => nudgeImageWidth(1)} />
            </div>
            <InspectorNumField
              id="split-hero-img-w"
              label=""
              min={0}
              max={2400}
              value={imageWidthPx || ''}
              placeholder="0 = full column"
              onChange={(n) => patchSlide({ imageWidthPx: n ?? 0 })}
            />
          </div>
          <div className="bld-field">
            <div className="bld-field-label-row">
              <label className="bld-label" htmlFor="split-hero-img-h">
                Mockup height (px)
              </label>
              <NudgeButtons label="Mockup height" onMinus={() => nudgeImageHeight(-1)} onPlus={() => nudgeImageHeight(1)} />
            </div>
            <InspectorNumField
              id="split-hero-img-h"
              label=""
              min={0}
              max={2400}
              value={imageHeightPx || ''}
              placeholder="0 = auto"
              onChange={(n) => patchSlide({ imageHeightPx: n ?? 0 })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <button type="button" className="bld-chip" onClick={() => patchSlide({ imageWidthPx: 0, imageHeightPx: 0 })}>
            Reset mockup size
          </button>
          <button
            type="button"
            className="bld-chip"
            onClick={() =>
              onChange('splitHeroVisualLayoutPatch', {
                splitHeroVisualWidthPct: 40,
                splitHeroVisualMinHeightPx: 0,
                splitHeroVisualOffsetXPx: 0,
                splitHeroVisualOffsetYPx: 0,
                splitHeroNavOffsetXPx: 0,
                splitHeroNavOffsetYPx: 0,
              splitHeroImageMaxHeightPx: 300,
              splitHeroImageScalePct: 100,
            })
          }
        >
          Reset column defaults
          </button>
        </div>
      </InspectorSection>

      <InspectorSection title="Move mockup" defaultOpen={false} keywords="offset card position">
        <OffsetPad
          onUp={() => nudgeOffsetY(-1)}
          onDown={() => nudgeOffsetY(1)}
          onLeft={() => nudgeOffsetX(-1)}
          onRight={() => nudgeOffsetX(1)}
          onReset={() =>
            onChange('splitHeroVisualLayoutPatch', {
              splitHeroVisualOffsetXPx: 0,
              splitHeroVisualOffsetYPx: 0,
            })
          }
          resetLabel="Reset mockup position"
        />
        <div className="bld-field-grid" style={{ marginTop: 8 }}>
          <InspectorNumField
            id="split-hero-offset-x"
            label="Offset X (px)"
            min={-480}
            max={480}
            value={visualOffsetXPx}
            onChange={(n) => onChange('splitHeroVisualOffsetXPx', String(n ?? 0))}
          />
          <InspectorNumField
            id="split-hero-offset-y"
            label="Offset Y (px)"
            min={-480}
            max={480}
            value={visualOffsetYPx}
            onChange={(n) => onChange('splitHeroVisualOffsetYPx', String(n ?? 0))}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Move arrows & dots" defaultOpen={false} keywords="nav pagination">
        <OffsetPad
          onUp={() => nudgeNavY(-1)}
          onDown={() => nudgeNavY(1)}
          onLeft={() => nudgeNavX(-1)}
          onRight={() => nudgeNavX(1)}
          onReset={() =>
            onChange('splitHeroVisualLayoutPatch', {
              splitHeroNavOffsetXPx: 0,
              splitHeroNavOffsetYPx: 0,
            })
          }
          resetLabel="Reset arrows"
        />
        <div className="bld-field-grid" style={{ marginTop: 8 }}>
          <InspectorNumField
            id="split-hero-nav-offset-x"
            label="Arrows X (px)"
            min={-480}
            max={480}
            value={navOffsetXPx}
            onChange={(n) => onChange('splitHeroNavOffsetXPx', String(n ?? 0))}
          />
          <InspectorNumField
            id="split-hero-nav-offset-y"
            label="Arrows Y (px)"
            min={-480}
            max={480}
            value={navOffsetYPx}
            onChange={(n) => onChange('splitHeroNavOffsetYPx', String(n ?? 0))}
          />
        </div>
      </InspectorSection>
    </div>
  );
}
