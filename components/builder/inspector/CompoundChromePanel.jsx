'use client';

import FeatureTabsControls from '@/components/builder/inspector/FeatureTabsControls';
import { InspectorNumField, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';
import { InspectorSection } from '@/components/builder/inspector/InspectorUi';
import { COMPOUND_CHROME_KINDS, getCompoundWidgetMeta } from '@/lib/compoundWidgetRegistry';

function ColorField({ id, label, formKey, value, onChange }) {
  const hex = /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#e2e8f0';
  return (
    <div className="bld-field">
      <label className="bld-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="color"
        className="bld-input"
        value={hex}
        onChange={(e) => onChange(formKey, e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function CompoundChromePanel({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  nestedFeatureTabsNode = null,
  onSelectFeatureTabs = null,
}) {
  const meta = getCompoundWidgetMeta(selectedNode?.nodeType);
  if (!meta?.caps?.supportsCompoundChrome) return null;

  const kind = meta.kind;

  if (kind === COMPOUND_CHROME_KINDS.tabs) {
    const editNode =
      selectedNode?.nodeType === 'tabs' ? selectedNode : nestedFeatureTabsNode || selectedNode;
    return (
      <FeatureTabsControls
        selectedNode={editNode}
        form={form}
        onChange={onChange}
        jsonErrors={jsonErrors}
        editingViaParent={selectedNode?.nodeType !== 'tabs'}
        onFocusFeatureTabs={onSelectFeatureTabs}
        chromeSection="style"
      />
    );
  }

  if (kind === COMPOUND_CHROME_KINDS.carousel) {
    return (
      <InspectorSection title="Carousel appearance" defaultOpen keywords="gap radius arrow dot image">
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          <strong>Gap</strong> and <strong>image fit</strong> are on the <strong>Content</strong> tab. Controls here
          map to <code>props.chrome</code> and affect arrows, dots, and slide corners on canvas + live.
        </p>
        <div className="bld-field-grid">
          <InspectorNumField
            id="carousel-card-radius"
            label="Slide / card radius (px)"
            min={0}
            max={48}
            value={form.carouselCardRadiusPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'carouselCardRadiusPx')}
          />
          <ColorField
            id="carousel-arrow-color"
            label="Arrow color"
            formKey="carouselArrowColor"
            value={form.carouselArrowColor}
            onChange={onChange}
          />
          <ColorField
            id="carousel-dot-color"
            label="Dot color"
            formKey="carouselDotColor"
            value={form.carouselDotColor}
            onChange={onChange}
          />
          <ColorField
            id="carousel-dot-active"
            label="Active dot color"
            formKey="carouselDotActiveColor"
            value={form.carouselDotActiveColor}
            onChange={onChange}
          />
        </div>
        <button type="button" className="bld-chip" style={{ marginTop: 8 }} onClick={() => onChange('carouselChromeReset', '1')}>
          Reset carousel chrome
        </button>
      </InspectorSection>
    );
  }

  if (kind === COMPOUND_CHROME_KINDS.accordion) {
    return (
      <InspectorSection title="Accordion appearance" defaultOpen keywords="faq header border radius">
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Edit questions on the <strong>Content</strong> tab or canvas. Colors here apply to each FAQ item shell.
        </p>
        <div className="bld-field-grid">
          <ColorField
            id="faq-header-bg"
            label="Item background"
            formKey="faqAccordionHeaderBg"
            value={form.faqAccordionHeaderBg}
            onChange={onChange}
          />
          <ColorField
            id="faq-active-color"
            label="Open state accent"
            formKey="faqAccordionActiveColor"
            value={form.faqAccordionActiveColor}
            onChange={onChange}
          />
          <ColorField
            id="faq-border-color"
            label="Border color"
            formKey="faqAccordionBorderColor"
            value={form.faqAccordionBorderColor}
            onChange={onChange}
          />
          <InspectorNumField
            id="faq-border-w"
            label="Border width (px)"
            min={0}
            max={8}
            value={form.faqAccordionBorderWidthPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'faqAccordionBorderWidthPx')}
          />
          <InspectorNumField
            id="faq-radius"
            label="Corner radius (px)"
            min={0}
            max={48}
            value={form.faqAccordionRadiusPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'faqAccordionRadiusPx')}
          />
        </div>
        <button type="button" className="bld-chip" style={{ marginTop: 8 }} onClick={() => onChange('faqAccordionChromeReset', '1')}>
          Reset accordion chrome
        </button>
      </InspectorSection>
    );
  }

  if (kind === COMPOUND_CHROME_KINDS.card) {
    return (
      <InspectorSection title="Card appearance" defaultOpen keywords="pricing background padding border shadow">
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Text and CTA: <strong>Content</strong> tab. Card shell uses <code>props.chrome</code> (not generic typography).
        </p>
        <div className="bld-field-grid">
          <ColorField
            id="card-bg"
            label="Background"
            formKey="cardChromeBg"
            value={form.cardChromeBg}
            onChange={onChange}
          />
          <InspectorNumField
            id="card-padding"
            label="Padding (px)"
            min={0}
            max={64}
            value={form.cardChromePaddingPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'cardChromePaddingPx')}
          />
          <ColorField
            id="card-border-color"
            label="Border color"
            formKey="cardChromeBorderColor"
            value={form.cardChromeBorderColor}
            onChange={onChange}
          />
          <InspectorNumField
            id="card-border-w"
            label="Border width (px)"
            min={0}
            max={8}
            value={form.cardChromeBorderWidthPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'cardChromeBorderWidthPx')}
          />
          <InspectorNumField
            id="card-radius"
            label="Corner radius (px)"
            min={0}
            max={48}
            value={form.cardChromeRadiusPx ?? 0}
            onChange={inspectorNumStringChange(onChange, 'cardChromeRadiusPx')}
          />
          <div className="bld-field">
            <label className="bld-label" htmlFor="card-shadow">
              Box shadow (CSS)
            </label>
            <input
              id="card-shadow"
              className="bld-input"
              placeholder="0 12px 40px rgba(0,0,0,0.12)"
              value={form.cardChromeShadow || ''}
              onChange={(e) => onChange('cardChromeShadow', e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="bld-chip" style={{ marginTop: 8 }} onClick={() => onChange('cardChromeReset', '1')}>
          Reset card chrome
        </button>
      </InspectorSection>
    );
  }

  return null;
}
