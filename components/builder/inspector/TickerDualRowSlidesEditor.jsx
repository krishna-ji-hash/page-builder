'use client';

import { InspectorNumInput } from '@/components/builder/inspector/InspectorNumeric';

function TickerRowBlock({
  rowKey,
  rowLabel,
  slides,
  onChange,
  onSlideImageUpload,
  openMedia,
  canUseMedia,
}) {
  return (
    <div className="bld-field" style={{ marginTop: rowKey === 'bottom' ? 16 : 0 }}>
      <div className="bld-field-label-row">
        <span className="bld-label">{rowLabel}</span>
        <button type="button" className="bld-chip" onClick={() => onChange('carouselAddSlide', rowKey)}>
          + Add logo
        </button>
      </div>
      <p className="bld-field-note" style={{ marginBottom: 10 }}>
        Logos in the {rowKey === 'top' ? 'upper' : 'lower'} scrolling row
      </p>
      <div className="bld-carousel-slides">
        {slides.map((slide, idx) => (
          <div
            key={String(slide?.id || `${rowKey}-${idx}`)}
            className="bld-carousel-slide-row"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(idx));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = Number(e.dataTransfer.getData('text/plain'));
              onChange('carouselSlidesReorder', { from, to: idx, tickerRow: rowKey });
            }}
          >
            <span className="bld-carousel-slide-handle" aria-hidden>
              ⋮⋮
            </span>
            <div className="bld-carousel-slide-meta">
              <div className="bld-carousel-slide-title">{String(slide?.title || `Logo ${idx + 1}`)}</div>
              <div className="bld-carousel-slide-sub">{slide?.imageSrc ? 'Image set' : 'No image'} · drag to reorder</div>
            </div>
            <button
              type="button"
              className="bld-btn-reset"
              onClick={() => onChange('carouselRemoveSlide', { index: idx, tickerRow: rowKey })}
              title="Remove logo"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="bld-carousel-editor" style={{ marginTop: 12 }}>
        {slides.map((slide, idx) => (
          <details key={String(slide?.id || `${rowKey}-edit-${idx}`)} className="bld-carousel-editor__slide" open={idx === 0}>
            <summary className="bld-carousel-editor__summary">
              <span className="bld-carousel-editor__title">{String(slide?.title || `Logo ${idx + 1}`)}</span>
              <span className="bld-carousel-editor__meta">{slide?.imageSrc ? 'Image' : 'No image'}</span>
            </summary>
            <div className="bld-carousel-editor__body">
              <div className="bld-field-grid">
                <div className="bld-field">
                  <label className="bld-label">Label (optional)</label>
                  <input
                    className="bld-input"
                    value={String(slide?.title || '')}
                    onChange={(e) =>
                      onChange('carouselSlidePatch', { index: idx, tickerRow: rowKey, patch: { title: e.target.value } })
                    }
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Image alt</label>
                  <input
                    className="bld-input"
                    value={String(slide?.imageAlt || '')}
                    onChange={(e) =>
                      onChange('carouselSlidePatch', { index: idx, tickerRow: rowKey, patch: { imageAlt: e.target.value } })
                    }
                  />
                </div>
              </div>
              <div className="bld-field-grid">
                <div className="bld-field">
                  <label className="bld-label">Upload image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="bld-input"
                    onChange={(e) => onSlideImageUpload(idx, rowKey, e)}
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Image URL</label>
                  <input
                    className="bld-input"
                    value={String(slide?.imageSrc || '')}
                    onChange={(e) =>
                      onChange('carouselSlidePatch', {
                        index: idx,
                        tickerRow: rowKey,
                        patch: { imageSrc: e.target.value, image: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              {slide?.imageSrc ? (
                <div className="bld-field">
                  <label className="bld-label">Preview</label>
                  <div
                    className="bld-media-inlinePreview"
                    style={{
                      backgroundImage: `url("${slide.imageSrc}")`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      minHeight: 72,
                    }}
                  />
                  <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto', marginTop: 8 }}>
                    <div />
                    <button
                      type="button"
                      className="bld-chip bld-chip--danger"
                      onClick={() =>
                        onChange('carouselSlidePatch', {
                          index: idx,
                          tickerRow: rowKey,
                          patch: { imageSrc: '', image: '', imageAlt: '' },
                        })
                      }
                    >
                      Clear image
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="bld-field">
                <label className="bld-label">Media Library</label>
                <button
                  type="button"
                  className="bld-chip"
                  disabled={!canUseMedia}
                  onClick={() =>
                    openMedia({ target: { type: 'carouselSlide', index: idx, tickerRow: rowKey }, allowedKinds: ['image', 'svg'] })
                  }
                >
                  Choose from Media Library
                </button>
              </div>
              <div className="bld-field-grid">
                <div className="bld-field">
                  <label className="bld-label">Image border radius (px)</label>
                  <InspectorNumInput
                    min={0}
                    max={48}
                    value={slide?.imageBorderRadiusPx ?? 0}
                    onChange={(n) =>
                      onChange('carouselSlidePatch', {
                        index: idx,
                        tickerRow: rowKey,
                        patch: { imageBorderRadiusPx: n ?? 0 },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function TickerDualRowSlidesEditor({
  topSlides,
  bottomSlides,
  onChange,
  onSlideImageUpload,
  openMedia,
  canUseMedia,
}) {
  return (
    <>
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        Upload logos separately for the <strong>top</strong> and <strong>bottom</strong> scrolling rows.
      </p>
      <TickerRowBlock
        rowKey="top"
        rowLabel="Top row logos"
        slides={topSlides}
        onChange={onChange}
        onSlideImageUpload={onSlideImageUpload}
        openMedia={openMedia}
        canUseMedia={canUseMedia}
      />
      <TickerRowBlock
        rowKey="bottom"
        rowLabel="Bottom row logos"
        slides={bottomSlides}
        onChange={onChange}
        onSlideImageUpload={onSlideImageUpload}
        openMedia={openMedia}
        canUseMedia={canUseMedia}
      />
    </>
  );
}
