import { normalizePageSeo, normalizeProjectSeo } from '../seo/seoEngine.js';

function safeTrim(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function walkNodes(nodes, visit) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walkNodes(n.children, visit);
  }
}

export function runTreeAudits({ tree, pageSeo, projectConfig }) {
  const warnings = [];
  const seo = normalizePageSeo(pageSeo || {});
  const projectSeo = normalizeProjectSeo(projectConfig || {});

  const title = safeTrim(seo.title);
  const desc = safeTrim(seo.description);
  const hasCanonical = Boolean(safeTrim(seo.canonicalUrl)) || Boolean(safeTrim(projectSeo.canonicalDomain));

  let h1Count = 0;
  const headingLevels = [];
  let animatedNodeCount = 0;
  const imagesMissingAlt = [];
  const buttonsMissingLabel = [];
  const menusMissingAriaLabel = [];
  const carousels = [];
  const repeaters = [];
  const sectionDomCounts = [];
  walkNodes(tree, (node) => {
    if (node?.nodeType === 'heading') {
      const tag = String(node?.props?.tag || 'h1').toLowerCase();
      if (tag === 'h1') h1Count += 1;
      const m = tag.match(/^h([1-6])$/);
      if (m) headingLevels.push({ nodeId: node.id, level: Number(m[1]) });
    }
    if (node?.nodeType === 'section' || node?.nodeType === 'row') {
      const countDescendants = (n) => {
        let c = 0;
        for (const ch of n.children || []) {
          if (!ch) continue;
          c += 1;
          c += countDescendants(ch);
        }
        return c;
      };
      const childCount = countDescendants(node);
      if (childCount > 120) {
        sectionDomCounts.push({ nodeId: node.id, label: node.displayName || node.nodeType, childCount });
      }
    }
    const styleJson = node?.style_json && typeof node.style_json === 'object' ? node.style_json : {};
    const animPreset =
      styleJson.desktop?.interactions?.animation?.preset ||
      styleJson.tablet?.interactions?.animation?.preset ||
      styleJson.mobile?.interactions?.animation?.preset ||
      null;
    if (animPreset && String(animPreset) !== 'none') animatedNodeCount += 1;
    if (node?.nodeType === 'tab_hero') {
      const panels = Array.isArray(node?.props?.panels) ? node.props.panels : [];
      for (let i = 0; i < panels.length; i += 1) {
        const panel = panels[i] || {};
        const img = safeTrim(panel.imageSrc || panel.imageUrl || panel.image || '');
        const alt = safeTrim(panel.imageAlt || panel.alt || '');
        if (img && !alt) {
          imagesMissingAlt.push({
            nodeId: node.id,
            label: `${node.displayName || 'Tab Hero'} panel ${i + 1}`,
          });
        }
      }
    }
    if (node?.nodeType === 'image') {
      const alt = safeTrim(node?.props?.alt || '');
      if (!alt) imagesMissingAlt.push({ nodeId: node.id, label: node.displayName || 'Image' });
      const hPx = Number(node?.props?.imageHeightPx || 0);
      const style = node?.style_json && typeof node.style_json === 'object' ? node.style_json : {};
      const desktopSize = style.desktop?.size || style.size || {};
      const hasAspect = Boolean(safeTrim(desktopSize.aspectRatio));
      if (!hPx && !hasAspect) {
        warnings.push({
          id: `cls-img-dims-${node.id}`,
          severity: 'suggestion',
          kind: 'cls',
          nodeId: node.id,
          label: 'Image missing reserved height (set image height or aspect ratio)',
        });
      }
    }
    if (node?.nodeType === 'button') {
      const text = safeTrim(node?.props?.text || '');
      if (!text) buttonsMissingLabel.push({ nodeId: node.id, label: node.displayName || 'Button' });
    }
    if (node?.nodeType === 'menu') {
      const aria = safeTrim(node?.props?.ariaLabel || '');
      if (!aria) menusMissingAriaLabel.push({ nodeId: node.id, label: node.displayName || 'Menu' });
    }
    if (node?.nodeType === 'carousel') {
      const slides = Array.isArray(node?.props?.slides) ? node.props.slides : [];
      carousels.push({
        nodeId: node.id,
        label: node.displayName || 'Carousel',
        slides,
        slidesPerView: node?.props?.slidesPerView || node?.props?.settings?.perView || null,
      });
    }
    const repeat = node?.props?.meta?.cms?.repeat;
    if (repeat && repeat.enabled) {
      repeaters.push({
        nodeId: node.id,
        label: node.displayName || 'Repeater',
        repeat,
        childCount: Array.isArray(node.children) ? node.children.length : 0,
      });
    }
  });

  // SEO reuse (basic)
  if (!title) warnings.push({ id: 'seo-title-missing', severity: 'warning', kind: 'seo', label: 'Missing SEO title' });
  if (title && title.length > 70) warnings.push({ id: 'seo-title-long', severity: 'suggestion', kind: 'seo', label: `SEO title too long (${title.length})` });
  if (title && title.length < 15) warnings.push({ id: 'seo-title-short', severity: 'suggestion', kind: 'seo', label: `SEO title too short (${title.length})` });
  if (!desc) warnings.push({ id: 'seo-desc-missing', severity: 'warning', kind: 'seo', label: 'Missing meta description' });
  if (desc && desc.length > 160) warnings.push({ id: 'seo-desc-long', severity: 'suggestion', kind: 'seo', label: `Meta description too long (${desc.length})` });
  if (desc && desc.length < 50) warnings.push({ id: 'seo-desc-short', severity: 'suggestion', kind: 'seo', label: `Meta description too short (${desc.length})` });
  if (!hasCanonical) warnings.push({ id: 'seo-canonical-missing', severity: 'suggestion', kind: 'seo', label: 'Missing canonical (page or project canonical domain)' });
  if (seo.noindex) warnings.push({ id: 'seo-noindex', severity: 'warning', kind: 'seo', label: 'noindex enabled' });

  // Heading hierarchy (tree order)
  for (let i = 1; i < headingLevels.length; i += 1) {
    const prev = headingLevels[i - 1];
    const cur = headingLevels[i];
    if (cur.level > prev.level + 1) {
      warnings.push({
        id: `a11y-heading-skip-${cur.nodeId}`,
        severity: 'suggestion',
        kind: 'a11y',
        nodeId: cur.nodeId,
        label: `Heading hierarchy skips levels (h${prev.level} → h${cur.level})`,
      });
    }
  }

  // A11y basics
  if (!h1Count) warnings.push({ id: 'a11y-h1-missing', severity: 'warning', kind: 'a11y', label: 'Missing H1 heading' });
  if (h1Count > 1) warnings.push({ id: 'a11y-h1-multiple', severity: 'suggestion', kind: 'a11y', label: `Multiple H1 headings (${h1Count})` });
  if (imagesMissingAlt.length) {
    warnings.push({
      id: 'a11y-img-alt-missing',
      severity: 'warning',
      kind: 'a11y',
      label: `Images missing alt text (${imagesMissingAlt.length})`,
      nodes: imagesMissingAlt,
    });
  }
  if (buttonsMissingLabel.length) {
    warnings.push({
      id: 'a11y-btn-label-missing',
      severity: 'suggestion',
      kind: 'a11y',
      label: `Buttons missing label text (${buttonsMissingLabel.length})`,
      nodes: buttonsMissingLabel,
    });
  }
  if (menusMissingAriaLabel.length) {
    warnings.push({
      id: 'a11y-menu-aria-missing',
      severity: 'suggestion',
      kind: 'a11y',
      label: `Menus missing explicit aria-label (${menusMissingAriaLabel.length})`,
      nodes: menusMissingAriaLabel,
    });
  }

  if (animatedNodeCount > 24) {
    warnings.push({
      id: 'perf-tree-animation-count',
      severity: animatedNodeCount > 48 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many nodes with entrance animations (${animatedNodeCount})`,
      quickFix: { label: 'Reduce animation intensity', type: 'reduceAnimationIntensity', pageLevel: true },
    });
  }

  for (const s of sectionDomCounts) {
    warnings.push({
      id: `perf-heavy-section-${s.nodeId}`,
      severity: s.childCount > 200 ? 'warning' : 'suggestion',
      kind: 'performance',
      nodeId: s.nodeId,
      label: `Heavy section subtree (${s.childCount} nodes)`,
    });
  }

  // Carousel detectors (tree-based)
  for (const c of carousels) {
    const slideCount = Array.isArray(c.slides) ? c.slides.length : 0;
    if (slideCount > 12) {
      warnings.push({
        id: `perf-carousel-too-many-${c.nodeId}`,
        severity: 'warning',
        kind: 'performance',
        nodeId: c.nodeId,
        label: `Carousel has many slides (${slideCount})`,
      });
    }
    const missingAltSlides = (c.slides || []).filter((s) => !safeTrim(s?.imageAlt || s?.alt || ''));
    if (missingAltSlides.length) {
      warnings.push({
        id: `a11y-carousel-slide-alt-${c.nodeId}`,
        severity: 'warning',
        kind: 'a11y',
        nodeId: c.nodeId,
        label: `Carousel slides missing image alt (${missingAltSlides.length})`,
      });
    }
    const pvMobile = Number(c?.slidesPerView?.mobile ?? c?.slidesPerView?.m ?? NaN);
    if (Number.isFinite(pvMobile) && pvMobile > 1) {
      warnings.push({
        id: `resp-carousel-perview-mobile-${c.nodeId}`,
        severity: 'suggestion',
        kind: 'responsive',
        nodeId: c.nodeId,
        label: `Carousel shows ${pvMobile} slides per view on mobile (may overflow)`,
        quickFix: {
          label: 'Set mobile slidesPerView = 1',
          type: 'reduceSlidesPerViewMobile',
        },
      });
    }
  }

  // CMS / repeater detectors (tree-based, observational)
  for (const r of repeaters) {
    const q = r.repeat?.query || {};
    const limit = q?.limit != null ? Number(q.limit) : null;
    const pageSize = q?.pageSize != null ? Number(q.pageSize) : null;
    if (!Number.isFinite(limit) && !Number.isFinite(pageSize)) {
      warnings.push({
        id: `cms-repeater-unbounded-${r.nodeId}`,
        severity: 'warning',
        kind: 'performance',
        nodeId: r.nodeId,
        label: 'CMS repeater has no limit/pageSize (unbounded query risk)',
      });
    }
    if (Number.isFinite(limit) && limit > 30) {
      warnings.push({
        id: `cms-repeater-huge-${r.nodeId}`,
        severity: 'suggestion',
        kind: 'performance',
        nodeId: r.nodeId,
        label: `CMS repeater limit is high (${limit})`,
      });
    }
    if (!Number.isFinite(pageSize) && Number.isFinite(limit) && limit > 12) {
      warnings.push({
        id: `cms-repeater-no-pagination-${r.nodeId}`,
        severity: 'suggestion',
        kind: 'performance',
        nodeId: r.nodeId,
        label: 'Repeater is large without pagination/pageSize',
      });
    }
    if (r.childCount > 80) {
      warnings.push({
        id: `dom-repeated-high-${r.nodeId}`,
        severity: 'warning',
        kind: 'performance',
        nodeId: r.nodeId,
        label: `Repeater rendered many children (${r.childCount})`,
      });
    }
  }

  return {
    warnings,
    summary: {
      h1Count,
      imagesMissingAltCount: imagesMissingAlt.length,
    },
  };
}

function severityWeight(sev) {
  if (sev === 'critical') return 18;
  if (sev === 'warning') return 10;
  return 6;
}

export function scoreFromWarnings(warnings) {
  const penalty = (warnings || []).reduce((sum, w) => sum + severityWeight(w.severity), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function buildOptimizationSuggestions(issues = []) {
  const ids = new Set(issues.map((i) => i.id));
  const byKind = new Map();
  issues.forEach((i) => {
    const k = i.kind || 'responsive';
    byKind.set(k, (byKind.get(k) || 0) + 1);
  });

  const suggestions = [];
  if (ids.has('perf-shadow-density')) suggestions.push({ kind: 'performance', label: 'This page has too many heavy shadows. Reduce box-shadow usage.' });
  if (ids.has('perf-filter-density')) suggestions.push({ kind: 'performance', label: 'Many CSS filters are used. Reduce blur/filter effects where possible.' });
  if (ids.has('perf-animation-density') || ids.has('perf-tree-animation-count') || ids.has('a11y-reduced-motion-animations')) {
    suggestions.push({ kind: 'performance', label: 'Many animated elements detected. Reduce animation intensity / count.' });
  }
  if ([...ids].some((x) => String(x).includes('cms-repeater-unbounded'))) suggestions.push({ kind: 'performance', label: 'Some CMS repeaters look unbounded. Add limit/pageSize (pagination).' });
  if ([...ids].some((x) => String(x).includes('resp-carousel-overflow'))) suggestions.push({ kind: 'responsive', label: 'Carousel overflow risk detected. Reduce slides per view on mobile.' });
  if ([...ids].some((x) => String(x).includes('a11y-contrast'))) suggestions.push({ kind: 'a11y', label: 'Low contrast text detected. Adjust colors (suggestion only).' });
  if ([...ids].some((x) => String(x).includes('perf-img-large'))) suggestions.push({ kind: 'performance', label: 'Large images detected. Compress and/or use modern formats.' });
  if ([...ids].some((x) => String(x).includes('cls-img-dims'))) suggestions.push({ kind: 'cls', label: 'Images missing intrinsic dimensions. Add width/height or aspect-ratio.' });

  // Always show a small summary recommendation if there are issues.
  if (!suggestions.length && issues.length) {
    suggestions.push({ kind: 'performance', label: 'Review the warnings list and apply quick fixes where safe.' });
  }
  return suggestions;
}

