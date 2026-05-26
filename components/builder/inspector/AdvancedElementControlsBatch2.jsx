'use client';

/** Inspector fields for advanced elements batch 2. */

export default function AdvancedElementControlsBatch2({ selectedNode, form, onChange, jsonErrors = {} }) {
  const t = selectedNode?.nodeType;
  if (!t) return null;

  if (t === 'container_box') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Title</label><input className="bld-input" value={form.containerTitle || ''} onChange={(e) => onChange('containerTitle', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Body</label><textarea className="bld-input bld-textarea" rows={3} value={form.containerBody || ''} onChange={(e) => onChange('containerBody', e.target.value)} /></div>
        <div className="bld-field">
          <label className="bld-label">Align</label>
          <select className="bld-input" value={form.containerAlign || 'left'} onChange={(e) => onChange('containerAlign', e.target.value)}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </div>
      </>
    );
  }

  if (t === 'grid_block') {
    return (
      <>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Columns</label><input type="number" min={1} max={6} className="bld-input" value={form.gridColumns ?? 3} onChange={(e) => onChange('gridColumns', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">Gap (px)</label><input type="number" min={0} max={48} className="bld-input" value={form.gridGapPx ?? 16} onChange={(e) => onChange('gridGapPx', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label"><input type="checkbox" checked={Boolean(form.gridMobileStack)} onChange={(e) => onChange('gridMobileStack', e.target.checked)} /> Stack on mobile</label></div>
        <div className="bld-field"><label className="bld-label">Items JSON</label><textarea className="bld-input bld-textarea" rows={8} value={form.gridItemsJson || '[]'} onChange={(e) => onChange('gridItemsJson', e.target.value)} />{jsonErrors.gridItemsJson ? <p className="bld-field-error">{jsonErrors.gridItemsJson}</p> : null}</div>
      </>
    );
  }

  if (t === 'alert_notice') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Type</label><select className="bld-input" value={form.alertVariant || 'info'} onChange={(e) => onChange('alertVariant', e.target.value)}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option></select></div>
        <div className="bld-field"><label className="bld-label">Title</label><input className="bld-input" value={form.alertTitle || ''} onChange={(e) => onChange('alertTitle', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Message</label><textarea className="bld-input bld-textarea" rows={3} value={form.alertMessage || ''} onChange={(e) => onChange('alertMessage', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label"><input type="checkbox" checked={Boolean(form.alertShowClose)} onChange={(e) => onChange('alertShowClose', e.target.checked)} /> Show close icon</label></div>
      </>
    );
  }

  if (t === 'badge_label') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Text</label><input className="bld-input" value={form.badgeText || ''} onChange={(e) => onChange('badgeText', e.target.value)} /></div>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Variant</label><select className="bld-input" value={form.badgeVariant || 'primary'} onChange={(e) => onChange('badgeVariant', e.target.value)}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="success">Success</option><option value="warning">Warning</option></select></div>
          <div className="bld-field"><label className="bld-label">Size</label><select className="bld-input" value={form.badgeSize || 'md'} onChange={(e) => onChange('badgeSize', e.target.value)}><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></div>
        </div>
        <div className="bld-field"><label className="bld-label">Link (optional)</label><input className="bld-input" value={form.badgeHref || ''} onChange={(e) => onChange('badgeHref', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'counter_block') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Value</label><input className="bld-input" value={form.counterValue || ''} onChange={(e) => onChange('counterValue', e.target.value)} /></div>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Prefix</label><input className="bld-input" value={form.counterPrefix || ''} onChange={(e) => onChange('counterPrefix', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">Suffix</label><input className="bld-input" value={form.counterSuffix || ''} onChange={(e) => onChange('counterSuffix', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label">Label</label><input className="bld-input" value={form.counterLabel || ''} onChange={(e) => onChange('counterLabel', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Description</label><input className="bld-input" value={form.counterDescription || ''} onChange={(e) => onChange('counterDescription', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'progress_bar') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Label</label><input className="bld-input" value={form.progressLabel || ''} onChange={(e) => onChange('progressLabel', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Percentage</label><input type="number" min={0} max={100} className="bld-input" value={form.progressPercentage ?? 0} onChange={(e) => onChange('progressPercentage', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Helper text</label><input className="bld-input" value={form.progressHelper || ''} onChange={(e) => onChange('progressHelper', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'rating_stars') {
    return (
      <>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Rating</label><input type="number" step="0.1" min={0} max={10} className="bld-input" value={form.ratingValue ?? 5} onChange={(e) => onChange('ratingValue', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">Max stars</label><input type="number" min={1} max={10} className="bld-input" value={form.ratingMaxStars ?? 5} onChange={(e) => onChange('ratingMaxStars', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label">Review text</label><input className="bld-input" value={form.ratingReviewText || ''} onChange={(e) => onChange('ratingReviewText', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'testimonial_card') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Name</label><input className="bld-input" value={form.testimonialName || ''} onChange={(e) => onChange('testimonialName', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Role</label><input className="bld-input" value={form.testimonialRole || ''} onChange={(e) => onChange('testimonialRole', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Message</label><textarea className="bld-input bld-textarea" rows={4} value={form.testimonialMessage || ''} onChange={(e) => onChange('testimonialMessage', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Avatar URL</label><input className="bld-input" value={form.testimonialAvatar || ''} onChange={(e) => onChange('testimonialAvatar', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Rating (0-5)</label><input type="number" min={0} max={5} className="bld-input" value={form.testimonialRating ?? 5} onChange={(e) => onChange('testimonialRating', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'pricing_card') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Plan name</label><input className="bld-input" value={form.pricingPlanName || ''} onChange={(e) => onChange('pricingPlanName', e.target.value)} /></div>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Price</label><input className="bld-input" value={form.pricingPrice || ''} onChange={(e) => onChange('pricingPrice', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">Period</label><input className="bld-input" value={form.pricingPeriod || ''} onChange={(e) => onChange('pricingPeriod', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label">Description</label><input className="bld-input" value={form.pricingDescription || ''} onChange={(e) => onChange('pricingDescription', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Features (one per line)</label><textarea className="bld-input bld-textarea" rows={4} value={form.pricingFeatures || ''} onChange={(e) => onChange('pricingFeatures', e.target.value)} /></div>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">CTA text</label><input className="bld-input" value={form.pricingCtaText || ''} onChange={(e) => onChange('pricingCtaText', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">CTA link</label><input className="bld-input" value={form.pricingCtaHref || ''} onChange={(e) => onChange('pricingCtaHref', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label"><input type="checkbox" checked={Boolean(form.pricingPopular)} onChange={(e) => onChange('pricingPopular', e.target.checked)} /> Popular plan</label></div>
      </>
    );
  }

  if (t === 'newsletter_form') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Heading</label><input className="bld-input" value={form.newsletterHeading || ''} onChange={(e) => onChange('newsletterHeading', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Text</label><textarea className="bld-input bld-textarea" rows={2} value={form.newsletterText || ''} onChange={(e) => onChange('newsletterText', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Email placeholder</label><input className="bld-input" value={form.newsletterPlaceholder || ''} onChange={(e) => onChange('newsletterPlaceholder', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Button text</label><input className="bld-input" value={form.newsletterButton || ''} onChange={(e) => onChange('newsletterButton', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'whatsapp_button') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Phone (country code, no +)</label><input className="bld-input" value={form.whatsappPhone || ''} onChange={(e) => onChange('whatsappPhone', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Prefilled message</label><textarea className="bld-input bld-textarea" rows={2} value={form.whatsappMessage || ''} onChange={(e) => onChange('whatsappMessage', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Button text</label><input className="bld-input" value={form.whatsappButtonText || ''} onChange={(e) => onChange('whatsappButtonText', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label"><input type="checkbox" checked={Boolean(form.whatsappFloating)} onChange={(e) => onChange('whatsappFloating', e.target.checked)} /> Floating style</label></div>
      </>
    );
  }

  if (t === 'countdown_timer') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Label</label><input className="bld-input" value={form.countdownLabel || ''} onChange={(e) => onChange('countdownLabel', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Target (ISO datetime)</label><input className="bld-input" value={form.countdownTargetIso || ''} onChange={(e) => onChange('countdownTargetIso', e.target.value)} placeholder="2026-12-31T23:59:59.000Z" /></div>
      </>
    );
  }

  if (t === 'html_block') {
    return (
      <div className="bld-field">
        <label className="bld-label">HTML (sanitized on render)</label>
        <textarea className="bld-input bld-textarea" rows={8} value={form.htmlBlockContent || ''} onChange={(e) => onChange('htmlBlockContent', e.target.value)} />
      </div>
    );
  }

  if (t === 'code_block') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Language</label><input className="bld-input" value={form.codeLanguage || ''} onChange={(e) => onChange('codeLanguage', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Code</label><textarea className="bld-input bld-textarea" rows={8} value={form.codeContent || ''} onChange={(e) => onChange('codeContent', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'lottie_animation') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Lottie JSON URL</label><input className="bld-input" value={form.lottieJsonUrl || ''} onChange={(e) => onChange('lottieJsonUrl', e.target.value)} /></div>
        <div className="bld-field-grid">
          <div className="bld-field"><label className="bld-label">Width</label><input type="number" min={80} max={640} className="bld-input" value={form.lottieWidthPx ?? 240} onChange={(e) => onChange('lottieWidthPx', e.target.value)} /></div>
          <div className="bld-field"><label className="bld-label">Height</label><input type="number" min={80} max={640} className="bld-input" value={form.lottieHeightPx ?? 240} onChange={(e) => onChange('lottieHeightPx', e.target.value)} /></div>
        </div>
        <div className="bld-field"><label className="bld-label">Alt text</label><input className="bld-input" value={form.lottieAlt || ''} onChange={(e) => onChange('lottieAlt', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'logo_block') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Image URL</label><input className="bld-input" value={form.logoSrc || ''} onChange={(e) => onChange('logoSrc', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Alt text</label><input className="bld-input" value={form.logoAlt || ''} onChange={(e) => onChange('logoAlt', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Link URL</label><input className="bld-input" value={form.logoHref || ''} onChange={(e) => onChange('logoHref', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Width (px)</label><input type="number" min={48} max={400} className="bld-input" value={form.logoWidthPx ?? 160} onChange={(e) => onChange('logoWidthPx', e.target.value)} /></div>
      </>
    );
  }

  if (t === 'feature_list') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Direction</label><select className="bld-input" value={form.featureListDirection || 'vertical'} onChange={(e) => onChange('featureListDirection', e.target.value)}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></div>
        <div className="bld-field"><label className="bld-label">Items JSON</label><textarea className="bld-input bld-textarea" rows={8} value={form.featureListJson || '[]'} onChange={(e) => onChange('featureListJson', e.target.value)} />{jsonErrors.featureListJson ? <p className="bld-field-error">{jsonErrors.featureListJson}</p> : null}</div>
      </>
    );
  }

  if (t === 'table_pro') {
    return (
      <>
        <div className="bld-field"><label className="bld-label">Highlight column (1-based)</label><input type="number" min={0} max={6} className="bld-input" value={form.tableProHighlightColumn ?? 0} onChange={(e) => onChange('tableProHighlightColumn', e.target.value)} /></div>
        <div className="bld-field"><label className="bld-label">Headers JSON</label><textarea className="bld-input bld-textarea" rows={3} value={form.tableProHeadersJson || '[]'} onChange={(e) => onChange('tableProHeadersJson', e.target.value)} />{jsonErrors.tableProHeadersJson ? <p className="bld-field-error">{jsonErrors.tableProHeadersJson}</p> : null}</div>
        <div className="bld-field"><label className="bld-label">Rows JSON</label><textarea className="bld-input bld-textarea" rows={8} value={form.tableProRowsJson || '[]'} onChange={(e) => onChange('tableProRowsJson', e.target.value)} />{jsonErrors.tableProRowsJson ? <p className="bld-field-error">{jsonErrors.tableProRowsJson}</p> : null}</div>
      </>
    );
  }

  return null;
}
