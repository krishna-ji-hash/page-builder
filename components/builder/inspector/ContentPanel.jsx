'use client';

import { MENU_ALIGNS, MENU_VARIANTS } from '@/lib/menuNav';
import {
  MENU_DRAWER_ACTION_LAYOUTS,
  MENU_DRAWER_DENSITIES,
  MENU_HAMBURGER_ALIGNS,
} from '@/lib/menuMobile';
import { useMemo, useState } from 'react';
import FormLeadsPanel from './FormLeadsPanel';
import MediaLibraryModal from '@/components/builder/media/MediaLibraryModal';
import MenuTreeEditor from '@/components/builder/inspector/MenuTreeEditor';
import CmsBindingsPanel from '@/components/builder/inspector/CmsBindingsPanel';
import InspectorTipChips from '@/components/builder/inspector/InspectorTipChips';
import FeatureTabsControls from '@/components/builder/inspector/FeatureTabsControls';
import FaqAccordionControls from '@/components/builder/inspector/FaqAccordionControls';
import AdvancedElementControls, { isAdvancedElementNodeType } from '@/components/builder/inspector/AdvancedElementControls';
import {
  InspectorNumField,
  InspectorNumInput,
  inspectorNumStringChange,
} from '@/components/builder/inspector/InspectorNumeric';

export default function ContentPanel({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  projectPages = [],
  projectId,
  pageId,
}) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaAllowedKinds, setMediaAllowedKinds] = useState(null);
  const [mediaPickTarget, setMediaPickTarget] = useState(null);

  const canUseMedia = useMemo(() => Number.isInteger(Number(projectId)) && Number(projectId) > 0, [projectId]);

  const openMedia = ({ target, allowedKinds }) => {
    if (!canUseMedia) return;
    setMediaPickTarget(target);
    setMediaAllowedKinds(Array.isArray(allowedKinds) ? allowedKinds : null);
    setMediaOpen(true);
  };

  const handlePicked = (item) => {
    if (!item?.publicUrl) return;
    const kind = String(item?.kind || '');
    // Safety: only image/svg allowed for these fields.
    if (kind !== 'image' && kind !== 'svg') return;
    if (mediaPickTarget === 'image') {
      onChange('src', item.publicUrl);
      if (!form.alt?.trim() && item.altText) onChange('alt', item.altText);
      if (item.title) onChange('imageTitle', item.title);
    } else if (typeof mediaPickTarget === 'object' && mediaPickTarget?.type === 'carouselSlide') {
      const idx = Number(mediaPickTarget.index);
      if (!Number.isInteger(idx) || idx < 0) return;
      onChange('carouselSlidePatch', {
        index: idx,
        patch: {
          imageSrc: item.publicUrl,
          image: item.publicUrl,
          imageAlt: item.altText || '',
          imageTitle: item.title || '',
        },
      });
    } else if (typeof mediaPickTarget === 'object' && mediaPickTarget?.type === 'featureTab') {
      const idx = Number(mediaPickTarget.index);
      if (!Number.isInteger(idx) || idx < 0) return;
      onChange('featureTabsPatch', {
        index: idx,
        patch: {
          imageSrc: item.publicUrl,
          image: item.publicUrl,
          imageAlt: item.altText || '',
        },
      });
    }
    setMediaOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      onChange('src', src);
      if (!form.alt?.trim()) {
        onChange('alt', file.name.replace(/\.[^.]+$/, ''));
      }
      event.target.value = '';
    };
    reader.onerror = () => {
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCarouselSlideImageUpload = (slideIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      onChange('carouselSlidePatch', {
        index: slideIndex,
        patch: {
          imageSrc: src,
          image: src,
          imageAlt: file.name.replace(/\.[^.]+$/, ''),
        },
      });
      event.target.value = '';
    };
    reader.onerror = () => {
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCarouselQuickImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      onChange('carouselEnsureSlide0Image', src);
      event.target.value = '';
    };
    reader.onerror = () => {
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  const isButton = selectedNode.nodeType === 'button';
  const isTextLike = selectedNode.nodeType === 'heading' || selectedNode.nodeType === 'text' || isButton;
  const isImage = selectedNode.nodeType === 'image';
  const isMenu = selectedNode.nodeType === 'menu';
  const isTable = selectedNode.nodeType === 'table';
  const isForm = selectedNode.nodeType === 'form';
  const isRichText = selectedNode.nodeType === 'rich_text';
  const isCarousel = selectedNode.nodeType === 'carousel';
  const isTabs = selectedNode.nodeType === 'tabs';
  const isAccordion = selectedNode.nodeType === 'accordion';
  const isDivider = selectedNode.nodeType === 'divider';
  const isAdvancedElement = isAdvancedElementNodeType(selectedNode.nodeType);
  const carouselVariantKey =
    isCarousel && ['image', 'hero', 'card', 'logo', 'ticker', 'marquee'].includes(form.carouselVariant)
      ? form.carouselVariant
      : 'image';
  const isLogoSlider = isCarousel && form.carouselVariant === 'logo';
  const isTickerSlider = isCarousel && form.carouselVariant === 'ticker';
  const isMarqueeSlider = isCarousel && form.carouselVariant === 'marquee';
  const isTickerOrMarquee = isCarousel && (isTickerSlider || isMarqueeSlider);
  const carouselSlides = isCarousel && Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : [];
  const formFields = isForm && Array.isArray(selectedNode.props?.fields) ? selectedNode.props.fields : [];
  const formNotifications =
    isForm && selectedNode.props?.notifications && typeof selectedNode.props.notifications === 'object'
      ? selectedNode.props.notifications
      : {};
  return (
    <div className="bld-panel">
      <div className="bld-panel__head">Content</div>
      <CmsBindingsPanel selectedNode={selectedNode} projectId={projectId} onChange={onChange} />
      {isDivider ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Orientation</label>
            <select
              className="bld-input"
              value={form.dividerOrientation || 'horizontal'}
              onChange={(e) => onChange('dividerOrientation', e.target.value)}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Line color</label>
            <input
              type="color"
              className="bld-input"
              value={form.bgColor || '#cbd5e1'}
              onChange={(e) => onChange('bgColor', e.target.value)}
            />
          </div>
          <InspectorNumField
            id="divider-thickness"
            label="Thickness (px)"
            min={1}
            max={32}
            value={form.dividerThicknessPx ?? 2}
            onChange={inspectorNumStringChange(onChange, 'dividerThicknessPx')}
          />
          <InspectorTipChips
            style={{ marginBottom: 12 }}
            chips={['Style → Background for gradients', 'Style → Size for length', 'Row stack: use V Line']}
          />
        </>
      ) : null}
      {isTextLike ? (
        <div className="bld-field">
          <label className="bld-label">{isButton ? 'Label' : selectedNode.nodeType === 'heading' ? 'Heading' : 'Text'}</label>
          {selectedNode.nodeType === 'text' ? (
            <textarea
              className="bld-input bld-textarea"
              rows={10}
              value={form.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Enter for new line. Style → Spacing → Padding."
            />
          ) : (
            <input className="bld-input" value={form.text || ''} onChange={(e) => onChange('text', e.target.value)} />
          )}
        </div>
      ) : null}
      {isRichText ? (
        <>
          <div className="bld-field">
            <label className="bld-label">HTML (sanitized on save)</label>
            <textarea
              className="bld-input bld-textarea"
              rows={8}
              value={form.richTextHtml || ''}
              onChange={(e) => onChange('richTextHtml', e.target.value)}
            />
          </div>
          <InspectorTipChips
            style={{ marginBottom: 12 }}
            chips={['Double-click canvas', 'Enter new paragraph', 'Multiple <p> tags', 'Padding: Style Spacing']}
          />
        </>
      ) : null}
      {isButton ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Type</label>
            <select className="bld-input" value={form.buttonType || 'default'} onChange={(e) => onChange('buttonType', e.target.value)}>
              <option value="default">Default</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Link</label>
            <input className="bld-input" value={form.href || ''} onChange={(e) => onChange('href', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Alignment</label>
            <div className="bld-layout-mini-panel__row">
              {['left', 'center', 'right'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`bld-layout-mini-btn ${form.alignment === v ? 'is-active' : ''}`}
                  onClick={() => onChange('alignment', v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="bld-field">
            <label className="bld-label">Size</label>
            <select className="bld-input" value={form.size || 'medium'} onChange={(e) => onChange('size', e.target.value)}>
              <option value="small">small</option>
              <option value="medium">medium</option>
              <option value="large">large</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Icon</label>
            <input
              className="bld-input"
              value={form.buttonIcon || ''}
              onChange={(e) => onChange('buttonIcon', e.target.value)}
              placeholder="arrow-down"
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Icon Position</label>
            <select
              className="bld-input"
              value={form.buttonIconPosition || 'after'}
              onChange={(e) => onChange('buttonIconPosition', e.target.value)}
            >
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Icon Spacing</label>
            <input
              type="range"
              min="0"
              max="40"
              className="bld-range"
              value={numInputDisplayValue(form.buttonIconSpacing, 10)}
              onChange={(e) => onChange('buttonIconSpacing', e.target.value)}
            />
            <InspectorNumInput
              min={0}
              max={80}
              value={form.buttonIconSpacing ?? 10}
              onChange={inspectorNumStringChange(onChange, 'buttonIconSpacing')}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Button ID</label>
            <input
              className="bld-input"
              value={form.buttonId || ''}
              onChange={(e) => onChange('buttonId', e.target.value)}
              placeholder="about_us_btn"
            />
            <p className="bld-field-note">Use letters, numbers, dashes or underscores only.</p>
          </div>
        </>
      ) : null}
      {isImage ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Image quick tools</label>
            <InspectorTipChips
              style={{ marginTop: 0, marginBottom: 8 }}
              chips={['One-click presets', 'Live + canvas', 'Tweak fields below', 'Exact width: Style Size']}
            />
            <div
              className="bld-field-grid"
              style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 8 }}
            >
              <button type="button" className="bld-chip" onClick={() => onChange('imageQuickPreset', 'naturalContain')}>
                Contain — full photo
              </button>
              <button type="button" className="bld-chip" onClick={() => onChange('imageQuickPreset', 'fullCover')}>
                Full width hero (cover, ~400px height)
              </button>
              <button type="button" className="bld-chip" onClick={() => onChange('imageQuickPreset', 'slimBanner')}>
                Slim banner strip (cover, 200px)
              </button>
              <button type="button" className="bld-chip" onClick={() => onChange('imageQuickPreset', 'logo')}>
                Logo / icon (contain, 56px)
              </button>
            </div>
          </div>
          <div className="bld-field">
            <label className="bld-label">Upload</label>
            <input type="file" accept="image/*" className="bld-input" onChange={handleImageUpload} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Media Library</label>
            <button
              type="button"
              className="bld-chip"
              disabled={!canUseMedia}
              title={!canUseMedia ? 'Media library needs a project context' : 'Choose from Media Library'}
              onClick={() => openMedia({ target: 'image', allowedKinds: ['image', 'svg'] })}
            >
              Choose from Media Library
            </button>
            <p className="bld-field-note">Keeps URL input for compatibility; Media Library stores uploads with metadata.</p>
          </div>
          <div className="bld-field">
            <label className="bld-label">Image URL</label>
            <input className="bld-input" value={form.src || ''} onChange={(e) => onChange('src', e.target.value)} />
          </div>
          {form.src ? (
            <div className="bld-field">
              <label className="bld-label">Preview</label>
              <div className="bld-media-inlinePreview" style={{ backgroundImage: `url(\"${form.src}\")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto', marginTop: 8 }}>
                <div />
                <button type="button" className="bld-chip bld-chip--danger" onClick={() => { onChange('src', ''); onChange('alt', ''); }}>
                  Clear image
                </button>
              </div>
            </div>
          ) : null}
          <div className="bld-field">
            <label className="bld-label">Alt</label>
            <input className="bld-input" value={form.alt || ''} onChange={(e) => onChange('alt', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Link URL (on click)</label>
            <input
              className="bld-input"
              value={form.href || ''}
              onChange={(e) => onChange('href', e.target.value)}
              placeholder="https://... or /page"
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                id="image-open-new-tab"
                type="checkbox"
                checked={Boolean(form.openInNewTab)}
                onChange={(e) => onChange('openInNewTab', e.target.checked)}
              />
              <label className="bld-label" htmlFor="image-open-new-tab" style={{ margin: 0 }}>
                Open in new tab
              </label>
            </div>
            <p className="bld-field-note">Leave empty to disable click link.</p>
          </div>
          <div className="bld-field">
            <label className="bld-label">Image fit (object-fit)</label>
            <select className="bld-input" value={form.imageFit || 'cover'} onChange={(e) => onChange('imageFit', e.target.value)}>
              <option value="cover">Cover — fills frame, may crop</option>
              <option value="contain">Contain — full image, letterboxing</option>
              <option value="fill">Fill — stretches, may distort</option>
            </select>
          </div>
          <InspectorNumField
            id="image-height-px"
            label="Image height (px)"
            min={0}
            max={9999}
            value={form.imageHeightPx ?? 0}
            placeholder="0 = natural height"
            onChange={inspectorNumStringChange(onChange, 'imageHeightPx')}
          />
          <p className="bld-field-note">0 = natural height. Set px for fixed box.</p>
        </>
      ) : null}
      {isMenu ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Direction</label>
            <select
              className="bld-input"
              value={form.menuDirection || 'row'}
              onChange={(e) => onChange('menuDirection', e.target.value)}
            >
              <option value="row">Horizontal</option>
              <option value="column">Vertical</option>
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Variant</label>
            <select
              className="bld-input"
              value={form.menuVariant || 'pill'}
              onChange={(e) => onChange('menuVariant', e.target.value)}
            >
              {MENU_VARIANTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="bld-field">
            <label className="bld-label">Link alignment (desktop)</label>
            <select
              className="bld-input"
              value={form.menuAlign || 'center'}
              onChange={(e) => onChange('menuAlign', e.target.value)}
            >
              {MENU_ALIGNS.map((a) => (
                <option key={a} value={a}>
                  {a === 'space-between' ? 'Space between' : a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="bld-style-section" style={{ marginTop: 12 }}>
            <div className="bld-style-section__head" style={{ cursor: 'default', padding: '0 0 8px' }}>
              <span className="bld-style-section__title">Mobile menu (☰)</span>
            </div>
            <div className="bld-style-section__body" style={{ paddingTop: 0 }}>
              <div className="bld-field">
                <label className="bld-label">Hamburger</label>
                <select
                  className="bld-input"
                  value={form.menuMobileEnabled ? 'yes' : 'no'}
                  onChange={(e) => onChange('menuMobileEnabled', e.target.value === 'yes')}
                >
                  <option value="yes">Show on mobile</option>
                  <option value="no">Hide (desktop links only)</option>
                </select>
              </div>
              <div className="bld-field">
                <label className="bld-label">Hamburger position</label>
                <select
                  className="bld-input"
                  value={form.menuMobileHamburgerAlign || 'right'}
                  onChange={(e) => onChange('menuMobileHamburgerAlign', e.target.value)}
                  disabled={!form.menuMobileEnabled}
                >
                  {MENU_HAMBURGER_ALIGNS.map((a) => (
                    <option key={a} value={a}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="bld-field-note">Row mein ☰ icon left / center / right align karein.</p>
              </div>
              <div className="bld-field">
                <label className="bld-label">Drawer title</label>
                <input
                  className="bld-input"
                  value={form.menuMobileTitle || ''}
                  onChange={(e) => onChange('menuMobileTitle', e.target.value)}
                  placeholder="Menu"
                  disabled={!form.menuMobileEnabled}
                />
              </div>
              <div className="bld-field">
                <label className="bld-label">Screen reader label</label>
                <input
                  className="bld-input"
                  value={form.menuMobileHamburgerLabel || ''}
                  onChange={(e) => onChange('menuMobileHamburgerLabel', e.target.value)}
                  placeholder="Open menu"
                  disabled={!form.menuMobileEnabled}
                />
              </div>
              <div className="bld-field" style={{ marginTop: 8 }}>
                <label className="bld-label">Compact layout up to</label>
                <select
                  className="bld-input"
                  value={String(form.menuMobileBreakpointPx ?? 1024)}
                  onChange={(e) => onChange('menuMobileBreakpointPx', e.target.value)}
                  disabled={!form.menuMobileEnabled}
                >
                  <option value="768">768px — phone only</option>
                  <option value="1024">1024px — phone + tablet (default)</option>
                  <option value="1200">1200px — large tablets</option>
                </select>
                <p className="bld-field-note">Is width par ☰ dikhega; header bar se Login / CTA hide honge.</p>
              </div>
              <div className="bld-style-section" style={{ marginTop: 14 }}>
                <div className="bld-style-section__head" style={{ cursor: 'default', padding: '0 0 8px' }}>
                  <span className="bld-style-section__title">Drawer panel</span>
                </div>
                <div className="bld-style-section__body" style={{ paddingTop: 0 }}>
                  <div className="bld-field">
                    <label className="bld-label">Header buttons in drawer</label>
                    <select
                      className="bld-input"
                      value={form.menuMobileShowDrawerActions !== false ? 'yes' : 'no'}
                      onChange={(e) => onChange('menuMobileShowDrawerActions', e.target.value === 'yes')}
                      disabled={!form.menuMobileEnabled}
                    >
                      <option value="yes">Show Login / CTA in drawer</option>
                      <option value="no">Hide (links only)</option>
                    </select>
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Drawer button layout</label>
                    <select
                      className="bld-input"
                      value={form.menuMobileDrawerActionsLayout || 'row'}
                      onChange={(e) => onChange('menuMobileDrawerActionsLayout', e.target.value)}
                      disabled={!form.menuMobileEnabled || form.menuMobileShowDrawerActions === false}
                    >
                      {MENU_DRAWER_ACTION_LAYOUTS.map((layout) => (
                        <option key={layout} value={layout}>
                          {layout === 'row' ? 'Side by side (Login | Get Started)' : 'Stacked (one per row)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Drawer spacing</label>
                    <select
                      className="bld-input"
                      value={form.menuMobileDrawerDensity || 'compact'}
                      onChange={(e) => onChange('menuMobileDrawerDensity', e.target.value)}
                      disabled={!form.menuMobileEnabled}
                    >
                      {MENU_DRAWER_DENSITIES.map((d) => (
                        <option key={d} value={d}>
                          {d === 'compact' ? 'Compact' : d === 'balanced' ? 'Balanced' : 'Roomy'}
                        </option>
                      ))}
                    </select>
                    <p className="bld-field-note">Links aur footer buttons ke beech gap control karein.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bld-field">
            <label className="bld-label">Aria Label</label>
            <input
              className="bld-input"
              value={form.menuAriaLabel || 'Main navigation'}
              onChange={(e) => onChange('menuAriaLabel', e.target.value)}
              placeholder="Main navigation"
            />
          </div>
          <MenuTreeEditor
            value={Array.isArray(selectedNode.props?.items) ? selectedNode.props.items : []}
            onChange={(nextItems) => onChange('menuItemsJson', JSON.stringify(nextItems || [], null, 2))}
          />
          {jsonErrors.menuItemsJson ? <p className="bld-field-error">{jsonErrors.menuItemsJson}</p> : null}
          <details className="bld-acc" style={{ marginTop: 10 }}>
            <summary>Advanced: Mega menu</summary>
            <div className="bld-field" style={{ marginTop: 10 }}>
              <label className="bld-label">Mega menu enabled</label>
              <select
                className="bld-input"
                value={form.menuMegaEnabled ? 'yes' : 'no'}
                onChange={(e) => onChange('menuMegaEnabled', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <InspectorNumField
              id="menu-mega-cols"
              label="Mega columns"
              min={1}
              max={6}
              value={form.menuMegaColumns ?? 2}
              onChange={inspectorNumStringChange(onChange, 'menuMegaColumns')}
            />
          </details>
          <div className="bld-field">
            <label className="bld-label">Use Project Pages for Navigation</label>
            <select
              className="bld-input"
              value={form.menuUseProjectPages ? 'yes' : 'no'}
              onChange={(e) => onChange('menuUseProjectPages', e.target.value === 'yes')}
            >
              <option value="no">No (manual links)</option>
              <option value="yes">Yes (auto page links)</option>
            </select>
            {form.menuUseProjectPages ? (
              <p className="bld-field-note">
                Auto links: {(projectPages || []).map((page) => page.slug).join(', ') || 'No pages found'}.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
      {isCarousel ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Slider type</label>
            <select
              className="bld-input"
              value={carouselVariantKey}
              onChange={(e) => onChange('carouselVariant', e.target.value)}
            >
              <option value="image">Image slider</option>
              <option value="hero">Hero slider</option>
              <option value="card">Card carousel</option>
              <option value="logo">Logo strip</option>
              <option value="ticker">Logo ticker (dual row)</option>
              <option value="marquee">Smooth marquee (one row)</option>
            </select>
            <p className="bld-field-note">Variants</p>
          </div>

          <div className="bld-field">
            <label className="bld-label">Image upload</label>
            <input type="file" accept="image/*" className="bld-input" onChange={handleCarouselQuickImageUpload} />
            <p className="bld-field-note">Primary</p>
          </div>

          <div className="bld-field">
            <div className="bld-field-label-row">
              <span className="bld-label">Slides</span>
              <button type="button" className="bld-chip" onClick={() => onChange('carouselAddSlide', true)}>
                + Add slide
              </button>
            </div>
            <p className="bld-field-note" style={{ marginBottom: 10 }}>
              Spacing
            </p>
            <div className="bld-carousel-slides">
              {(Array.isArray(selectedNode.props?.slides) ? selectedNode.props.slides : []).map((slide, idx) => (
                <div
                  key={String(slide?.id || idx)}
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
                    const to = idx;
                    onChange('carouselSlidesReorder', { from, to });
                  }}
                >
                  <span className="bld-carousel-slide-handle" aria-hidden>
                    ⋮⋮
                  </span>
                  <div className="bld-carousel-slide-meta">
                    <div className="bld-carousel-slide-title">{String(slide?.title || `Slide ${idx + 1}`)}</div>
                    <div className="bld-carousel-slide-sub">{slide?.imageSrc ? 'Image' : 'No image'} · drag to reorder</div>
                  </div>
                  <button type="button" className="bld-btn-reset" onClick={() => onChange('carouselRemoveSlide', idx)} title="Remove slide">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bld-field">
            <label className="bld-label">Slide editor</label>
            <p className="bld-field-note" style={{ marginTop: 0 }}>
              Slides
            </p>
            <div className="bld-carousel-editor">
              {carouselSlides.map((slide, idx) => (
                <details key={String(slide?.id || idx)} className="bld-carousel-editor__slide" open={idx === 0}>
                  <summary className="bld-carousel-editor__summary">
                    <span className="bld-carousel-editor__title">{String(slide?.title || `Slide ${idx + 1}`)}</span>
                    <span className="bld-carousel-editor__meta">{slide?.imageSrc ? 'Image' : 'No image'}</span>
                  </summary>
                  <div className="bld-carousel-editor__body">
                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Title</label>
                        <input
                          className="bld-input"
                          value={String(slide?.title || '')}
                          onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { title: e.target.value } })}
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Subtitle</label>
                        <input
                          className="bld-input"
                          value={String(slide?.subtitle || '')}
                          onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { subtitle: e.target.value } })}
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Image Alt</label>
                        <input
                          className="bld-input"
                          value={String(slide?.imageAlt || '')}
                          onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { imageAlt: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="bld-field">
                      <label className="bld-label">Body</label>
                      <textarea
                        className="bld-input bld-textarea"
                        rows={3}
                        value={String(slide?.body || '')}
                        onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { body: e.target.value } })}
                      />
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Upload image</label>
                        <input type="file" accept="image/*" className="bld-input" onChange={(e) => handleCarouselSlideImageUpload(idx, e)} />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Image URL</label>
                        <input
                          className="bld-input"
                          value={String(slide?.imageSrc || '')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', {
                              index: idx,
                              patch: { imageSrc: e.target.value, image: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    {slide?.imageSrc ? (
                      <div className="bld-field">
                        <label className="bld-label">Preview</label>
                        <div className="bld-media-inlinePreview" style={{ backgroundImage: `url(\"${slide.imageSrc}\")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto', marginTop: 8 }}>
                          <div />
                          <button
                            type="button"
                            className="bld-chip bld-chip--danger"
                            onClick={() => onChange('carouselSlidePatch', { index: idx, patch: { imageSrc: '', image: '', imageAlt: '' } })}
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
                        onClick={() => openMedia({ target: { type: 'carouselSlide', index: idx }, allowedKinds: ['image', 'svg'] })}
                      >
                        Choose from Media Library
                      </button>
                    </div>

                    <div className="bld-field">
                      <label className="bld-label">Image border radius (px)</label>
                      <InspectorNumInput
                        min={0}
                        max={200}
                        value={slide?.imageBorderRadiusPx ?? 0}
                        onChange={(n) =>
                          onChange('carouselSlidePatch', {
                            index: idx,
                            patch: { imageBorderRadiusPx: n ?? 0 },
                          })
                        }
                      />
                      <p className="bld-field-note">Rounded corners on this slide&apos;s image</p>
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Image width (px)</label>
                        <InspectorNumInput
                          min={0}
                          max={2400}
                          value={slide?.imageWidthPx ?? ''}
                          placeholder="0 = full width"
                          onChange={(n) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { imageWidthPx: n ?? 0 } })
                          }
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Image height (px)</label>
                        <InspectorNumInput
                          min={0}
                          max={2400}
                          value={slide?.imageHeightPx ?? ''}
                          placeholder="0 = full height"
                          onChange={(n) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { imageHeightPx: n ?? 0 } })
                          }
                        />
                      </div>
                    </div>
                    <div className="bld-field">
                      <label className="bld-label">Focal point (crop with Cover)</label>
                      <select
                        className="bld-input"
                        value={String(slide?.imageObjectPosition || '')}
                        onChange={(e) =>
                          onChange('carouselSlidePatch', {
                            index: idx,
                            patch: { imageObjectPosition: e.target.value || '' },
                          })
                        }
                      >
                        <option value="">Use carousel default</option>
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                      <p className="bld-field-note">When Image fit is Cover, shifts which part of the photo stays visible (simple crop).</p>
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Card title</label>
                        <input
                          className="bld-input"
                          value={String(slide?.card?.title || '')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { card: { ...(slide?.card || {}), title: e.target.value } } })
                          }
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Card body</label>
                        <input
                          className="bld-input"
                          value={String(slide?.card?.body || '')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { card: { ...(slide?.card || {}), body: e.target.value } } })
                          }
                        />
                      </div>
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Card align</label>
                        <select
                          className="bld-input"
                          value={String(slide?.card?.align || 'left')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { card: { ...(slide?.card || {}), align: e.target.value } } })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Card theme</label>
                        <select
                          className="bld-input"
                          value={String(slide?.card?.theme || 'dark')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { card: { ...(slide?.card || {}), theme: e.target.value } } })
                          }
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">CTA label</label>
                        <input
                          className="bld-input"
                          value={String(slide?.cta?.label || '')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { cta: { ...(slide?.cta || {}), label: e.target.value } } })
                          }
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">CTA link</label>
                        <input
                          className="bld-input"
                          value={String(slide?.cta?.href || '')}
                          onChange={(e) =>
                            onChange('carouselSlidePatch', { index: idx, patch: { cta: { ...(slide?.cta || {}), href: e.target.value } } })
                          }
                        />
                      </div>
                    </div>

                    <div className="bld-field-grid">
                      <div className="bld-field">
                        <label className="bld-label">Button text</label>
                        <input
                          className="bld-input"
                          value={String(slide?.buttonText || '')}
                          onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { buttonText: e.target.value } })}
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Button URL</label>
                        <input
                          className="bld-input"
                          value={String(slide?.buttonUrl || '')}
                          onChange={(e) => onChange('carouselSlidePatch', { index: idx, patch: { buttonUrl: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="bld-field">
            <label className="bld-label">{isTickerOrMarquee ? 'Scroll duration (seconds)' : 'Image fit'}</label>
            {isTickerOrMarquee ? (
              <>
                <InspectorNumInput
                  min={8}
                  max={120}
                  value={form.carouselTickerDurationSec ?? ''}
                  onChange={inspectorNumStringChange(onChange, 'carouselTickerDurationSec')}
                />
                <p className="bld-field-note" style={{ marginTop: 8 }}>
                  Duration
                </p>
              </>
            ) : isLogoSlider ? (
              <p className="bld-field-note" style={{ marginTop: 0 }}>
                Contain
              </p>
            ) : (
              <select className="bld-input" value={form.carouselImageFit || 'cover'} onChange={(e) => onChange('carouselImageFit', e.target.value)}>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>
            )}
            {!isTickerOrMarquee ? <p className="bld-field-note">Fill</p> : null}
          </div>

          <div className="bld-field">
            <label className="bld-label">Scroll direction</label>
            <select
              className="bld-input"
              value={form.carouselScrollDirection || (isTickerSlider ? 'opposite' : 'right')}
              onChange={(e) => onChange('carouselScrollDirection', e.target.value)}
            >
              <option value="left">{isTickerSlider ? 'Both rows left (←)' : 'Left (←)'}</option>
              <option value="right">{isTickerSlider ? 'Both rows right (→)' : 'Right (→)'}</option>
              {isTickerSlider ? <option value="opposite">Opposite (top ←, bottom →)</option> : null}
            </select>
            <p className="bld-field-note">
              {isTickerSlider ? 'Dual row: use Opposite for row 1 left, row 2 right.' : 'Flow'}
            </p>
          </div>

          {!isLogoSlider && !isTickerOrMarquee && form.carouselVariant !== 'card' && (form.carouselImageFit || 'cover') === 'cover' ? (
            <div className="bld-field">
              <label className="bld-label">Cover alignment</label>
              <select
                className="bld-input"
                value={form.carouselImageObjectPosition || 'center'}
                onChange={(e) => onChange('carouselImageObjectPosition', e.target.value)}
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
              <p className="bld-field-note">Anchor</p>
            </div>
          ) : null}

          {!isTickerOrMarquee ? (
            <div className="bld-field bld-field--row">
              <label className="bld-label" style={{ marginBottom: 0 }}>
                Show overlay (text card)
              </label>
              <select
                className="bld-input"
                value={form.carouselShowOverlay ? 'yes' : 'no'}
                onChange={(e) => onChange('carouselShowOverlay', e.target.value === 'yes')}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          ) : null}

          {!isTickerOrMarquee ? (
          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Auto-advance</label>
              <select className="bld-input" value={form.carouselAutoplay ? 'yes' : 'no'} onChange={(e) => onChange('carouselAutoplay', e.target.value === 'yes')}>
                <option value="no">Manual</option>
                <option value="yes">Auto</option>
              </select>
            </div>
            <div className="bld-field">
              <label className="bld-label">Loop</label>
              <select className="bld-input" value={form.carouselLoop ? 'yes' : 'no'} onChange={(e) => onChange('carouselLoop', e.target.value === 'yes')}>
                <option value="yes">On</option>
                <option value="no">Off</option>
              </select>
            </div>
          </div>
          ) : null}

          <div className="bld-field">
            <label className="bld-label">Pause on hover</label>
            <select className="bld-input" value={form.carouselPauseOnHover ? 'yes' : 'no'} onChange={(e) => onChange('carouselPauseOnHover', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <p className="bld-field-note">Hover</p>
          </div>

          {!isTickerOrMarquee ? (
          <div className="bld-field-grid">
            <div className="bld-field">
              <label className="bld-label">Arrows</label>
              <select className="bld-input" value={form.carouselArrows ? 'yes' : 'no'} onChange={(e) => onChange('carouselArrows', e.target.value === 'yes')}>
                <option value="yes">On</option>
                <option value="no">Off</option>
              </select>
            </div>
            <div className="bld-field">
              <label className="bld-label">Dots</label>
              <select className="bld-input" value={form.carouselDots ? 'yes' : 'no'} onChange={(e) => onChange('carouselDots', e.target.value === 'yes')}>
                <option value="yes">On</option>
                <option value="no">Off</option>
              </select>
            </div>
          </div>
          ) : null}

          {!isTickerOrMarquee ? (
          <div className="bld-field-grid">
            <InspectorNumField
              id="carousel-speed"
              label="Speed (ms)"
              min={0}
              max={60000}
              step={10}
              value={form.carouselSpeedMs ?? ''}
              onChange={inspectorNumStringChange(onChange, 'carouselSpeedMs')}
            />
            <InspectorNumField
              id="carousel-interval"
              label="Interval (ms)"
              min={0}
              max={60000}
              step={100}
              value={form.carouselIntervalMs ?? ''}
              onChange={inspectorNumStringChange(onChange, 'carouselIntervalMs')}
            />
            <InspectorNumField
              id="carousel-gap"
              label="Gap (px)"
              min={0}
              max={120}
              value={form.carouselGapPx ?? ''}
              onChange={inspectorNumStringChange(onChange, 'carouselGapPx')}
            />
          </div>
          ) : (
            <InspectorNumField
              id="carousel-gap-cards"
              label="Gap between cards (px)"
              min={0}
              max={120}
              value={form.carouselGapPx ?? ''}
              onChange={inspectorNumStringChange(onChange, 'carouselGapPx')}
            />
          )}

          {!isTickerOrMarquee ? (
            <div className="bld-field">
              <label className="bld-label">Transition</label>
              <select
                className="bld-input"
                value={form.carouselTransitionEasing || 'ease'}
                onChange={(e) => onChange('carouselTransitionEasing', e.target.value)}
              >
                <option value="ease">Ease</option>
                <option value="linear">Linear</option>
                <option value="ease-in-out">Smooth</option>
                <option value="ease-out">Out</option>
              </select>
              <p className="bld-field-note">Easing</p>
            </div>
          ) : null}

          {!isTickerOrMarquee ? (
          <div className="bld-field">
            <label className="bld-label">Slides per view (this breakpoint)</label>
            <InspectorNumInput
              min={1}
              max={6}
              value={form.carouselPerView ?? ''}
              onChange={inspectorNumStringChange(onChange, 'carouselPerView')}
            />
            <p className="bld-field-note">Viewport</p>
            {carouselSlides.length > 1 &&
            Number(form.carouselPerView || 1) >= carouselSlides.length ? (
              <p className="bld-field-note" style={{ color: '#b45309' }}>
                Reduce
              </p>
            ) : null}
          </div>
          ) : null}

          <details className="bld-acc" style={{ marginTop: 10 }}>
            <summary>Advanced: Slides JSON</summary>
            <div className="bld-field" style={{ marginTop: 10 }}>
              <textarea
                className="bld-input"
                rows={8}
                value={form.carouselSlidesJson || '[]'}
                onChange={(e) => onChange('carouselSlidesJson', e.target.value)}
              />
              {jsonErrors.carouselSlidesJson ? <p className="bld-field-error">{jsonErrors.carouselSlidesJson}</p> : null}
              <p className="bld-field-note">Keys</p>
            </div>
          </details>
        </>
      ) : null}
      {isTabs ? (
        <FeatureTabsControls
          selectedNode={selectedNode}
          form={form}
          onChange={onChange}
          jsonErrors={jsonErrors}
        />
      ) : null}
      {isAccordion ? (
        <FaqAccordionControls
          selectedNode={selectedNode}
          form={form}
          onChange={onChange}
          jsonErrors={jsonErrors}
        />
      ) : null}
      {isAdvancedElement ? (
        <AdvancedElementControls selectedNode={selectedNode} form={form} onChange={onChange} jsonErrors={jsonErrors} />
      ) : null}
      {isTable ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Columns JSON</label>
            <textarea
              className="bld-input"
              rows={6}
              value={form.tableColumnsJson || '[]'}
              onChange={(e) => onChange('tableColumnsJson', e.target.value)}
            />
            {jsonErrors.tableColumnsJson ? <p className="bld-field-error">{jsonErrors.tableColumnsJson}</p> : null}
          </div>
        </>
      ) : null}
      {isForm ? (
        <>
          <FormLeadsPanel
            pageId={pageId}
            projectId={projectId}
            formNodeId={selectedNode?.id}
            fields={formFields}
          />
          <div className="bld-field">
            <label className="bld-label">Submit Label</label>
            <input className="bld-input" value={form.submitLabel || ''} onChange={(e) => onChange('submitLabel', e.target.value)} />
          </div>
          <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
            Label/input gap: <strong>Style</strong> tab → <strong>Form spacing</strong>. Fields &amp; submit text yahan.
          </p>
          <div className="bld-form-builder">
            <div className="bld-form-builder__head">
              <div className="bld-form-builder__title">Fields</div>
              <button type="button" className="bld-btn" onClick={() => onChange('formAddField')}>
                + Add field
              </button>
            </div>

            {formFields.length ? (
              <div className="bld-form-fields">
                {formFields.map((f, idx) => (
                  <div
                    key={String(f?.id || f?.name || idx)}
                    className="bld-form-field-row"
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
                      const to = idx;
                      if (!Number.isInteger(from) || from < 0) return;
                      if (from === to) return;
                      onChange('formReorderFields', { from, to });
                    }}
                    title="Drag to reorder"
                  >
                    <span className="bld-form-field-handle" aria-hidden>
                      ⋮⋮
                    </span>
                    <div className="bld-form-field-meta">
                      <div className="bld-form-field-title">
                        {String(f?.label || f?.name || `Field ${idx + 1}`)}
                        {f?.required ? <span className="bld-form-field-req"> *</span> : null}
                      </div>
                      <div className="bld-form-field-sub">
                        {String(f?.type || 'text')} · {String(f?.width || '100%')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bld-btn-reset"
                      onClick={() => onChange('formRemoveField', idx)}
                      title="Remove field"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="bld-panel__hint">No fields yet. Click “Add field”.</p>
            )}

            {formFields.map((f, idx) => (
              <details key={`edit-${String(f?.id || f?.name || idx)}`} className="bld-form-editor__field" open={idx === 0}>
                <summary className="bld-form-editor__summary">
                  <span className="bld-form-editor__title">{String(f?.label || f?.name || `Field ${idx + 1}`)}</span>
                  <span className="bld-form-editor__meta">{String(f?.type || 'text')}</span>
                </summary>
                <div className="bld-form-editor__grid">
                  <div className="bld-field">
                    <label className="bld-label">Name</label>
                    <input
                      className="bld-input"
                      value={String(f?.name || '')}
                      onChange={(e) =>
                        onChange('formPatchField', {
                          index: idx,
                          patch: { name: e.target.value },
                        })
                      }
                      placeholder="email"
                    />
                    <p className="bld-field-note">Used as the key in submissions. Letters/numbers/underscore recommended.</p>
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Label</label>
                    <input
                      className="bld-input"
                      value={String(f?.label || '')}
                      onChange={(e) =>
                        onChange('formPatchField', {
                          index: idx,
                          patch: { label: e.target.value },
                        })
                      }
                      placeholder="Email"
                    />
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Type</label>
                    <select
                      className="bld-input"
                      value={String(f?.type || 'text')}
                      onChange={(e) =>
                        onChange('formPatchField', {
                          index: idx,
                          patch: { type: e.target.value },
                        })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="radio">Radio</option>
                      <option value="switch">Switch</option>
                      <option value="file">File upload</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Placeholder</label>
                    <input
                      className="bld-input"
                      value={String(f?.placeholder || '')}
                      onChange={(e) =>
                        onChange('formPatchField', {
                          index: idx,
                          patch: { placeholder: e.target.value },
                        })
                      }
                      placeholder="Enter value"
                    />
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Width</label>
                    <select
                      className="bld-input"
                      value={String(f?.width || '100%')}
                      onChange={(e) =>
                        onChange('formPatchField', {
                          index: idx,
                          patch: { width: e.target.value },
                        })
                      }
                    >
                      <option value="100%">100%</option>
                      <option value="75%">75%</option>
                      <option value="66.66%">66.66%</option>
                      <option value="50%">50%</option>
                      <option value="33.33%">33.33%</option>
                      <option value="25%">25%</option>
                      <option value="auto">auto</option>
                    </select>
                  </div>
                  <div className="bld-field bld-field--row">
                    <label className="bld-label">Required</label>
                    <label className="bld-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(f?.required)}
                        onChange={(e) =>
                          onChange('formPatchField', {
                            index: idx,
                            patch: { required: e.target.checked },
                          })
                        }
                      />
                      <span>Required</span>
                    </label>
                  </div>

                  {String(f?.type || '') === 'select' || String(f?.type || '') === 'radio' ? (
                    <div className="bld-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="bld-label">Options (one per line)</label>
                      <textarea
                        className="bld-input bld-textarea"
                        rows={4}
                        value={Array.isArray(f?.options) ? f.options.map((o) => (typeof o === 'string' ? o : String(o?.label || o?.value || ''))).join('\n') : ''}
                        onChange={(e) =>
                          onChange('formPatchField', {
                            index: idx,
                            patch: {
                              options: String(e.target.value || '')
                                .split('\n')
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .slice(0, 50),
                            },
                          })
                        }
                        placeholder={"Option A\nOption B"}
                      />
                    </div>
                  ) : null}

                  <details className="bld-acc" style={{ gridColumn: '1 / -1' }}>
                    <summary>Validation</summary>
                    <div className="bld-form-validation">
                      <div className="bld-field">
                        <label className="bld-label">Min</label>
                        <input
                          className="bld-input"
                          value={String(f?.validation?.min ?? '')}
                          onChange={(e) =>
                            onChange('formPatchField', {
                              index: idx,
                              patch: { validation: { ...(f?.validation || {}), min: e.target.value } },
                            })
                          }
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div className="bld-field">
                        <label className="bld-label">Max</label>
                        <input
                          className="bld-input"
                          value={String(f?.validation?.max ?? '')}
                          onChange={(e) =>
                            onChange('formPatchField', {
                              index: idx,
                              patch: { validation: { ...(f?.validation || {}), max: e.target.value } },
                            })
                          }
                          placeholder="e.g. 50"
                        />
                      </div>
                      <div className="bld-field" style={{ gridColumn: '1 / -1' }}>
                        <label className="bld-label">Regex (advanced)</label>
                        <input
                          className="bld-input"
                          value={String(f?.validation?.regex ?? '')}
                          onChange={(e) =>
                            onChange('formPatchField', {
                              index: idx,
                              patch: { validation: { ...(f?.validation || {}), regex: e.target.value } },
                            })
                          }
                          placeholder="e.g. ^[A-Z0-9]{6}$"
                        />
                      </div>
                      <div className="bld-field" style={{ gridColumn: '1 / -1' }}>
                        <label className="bld-label">Custom error message</label>
                        <input
                          className="bld-input"
                          value={String(f?.validation?.message ?? '')}
                          onChange={(e) =>
                            onChange('formPatchField', {
                              index: idx,
                              patch: { validation: { ...(f?.validation || {}), message: e.target.value } },
                            })
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </details>
            ))}

            <details className="bld-acc" style={{ marginTop: 10 }} open>
              <summary>Notifications</summary>
              <div className="bld-field" style={{ marginTop: 10 }}>
                <label className="bld-label">Webhook URL (optional)</label>
                <input
                  className="bld-input"
                  value={String(formNotifications.webhookUrl || '')}
                  onChange={(e) => onChange('formSetNotifications', { webhookUrl: e.target.value })}
                  placeholder="https://hooks.zapier.com/..."
                />
                <p className="bld-field-note">
                  On submit, we POST JSON with <code>values</code>, <code>formId</code>, and <code>projectId</code> to
                  this URL.
                </p>
              </div>
              <div className="bld-field">
                <label className="bld-label">Email notify (optional)</label>
                <input
                  className="bld-input"
                  value={String(formNotifications.emailTo || '')}
                  onChange={(e) => onChange('formSetNotifications', { emailTo: e.target.value })}
                  placeholder="you@domain.com"
                />
                <p className="bld-field-note">
                  Saved with the form. Leads always go to the database first; automatic email is coming soon.
                </p>
              </div>
            </details>

            <details className="bld-acc" style={{ marginTop: 10 }}>
              <summary>Advanced: Fields JSON</summary>
              <div className="bld-field" style={{ marginTop: 10 }}>
                <textarea
                  className="bld-input"
                  rows={8}
                  value={form.formFieldsJson || '[]'}
                  onChange={(e) => onChange('formFieldsJson', e.target.value)}
                />
                {jsonErrors.formFieldsJson ? <p className="bld-field-error">{jsonErrors.formFieldsJson}</p> : null}
              </div>
            </details>
          </div>
        </>
      ) : null}
      <MediaLibraryModal
        open={mediaOpen}
        projectId={Number(projectId) || 0}
        allowedKinds={mediaAllowedKinds}
        onClose={() => setMediaOpen(false)}
        onPick={handlePicked}
      />
    </div>
  );
}
