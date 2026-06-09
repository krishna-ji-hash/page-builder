/**
 * Builder DOM audits — real measurements via getComputedStyle + layout boxes.
 * No renderTree mutation; no CSS layout overrides.
 */
import { findNodeInTree } from '../builderTree.js';

export function parsePx(v) {
  const n = parseFloat(String(v || '').replace('px', '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function classifyOverflow(el, rootRect) {
  const rect = el.getBoundingClientRect();
  const outsideX = rect.left < rootRect.left - 0.5 || rect.right > rootRect.right + 0.5;
  const outsideY = rect.top < rootRect.top - 0.5 || rect.bottom > rootRect.bottom + 0.5;
  return { rect, outsideX, outsideY };
}

export function resolveAuditDevice(device, rootEl) {
  const d = String(device || 'desktop').trim().toLowerCase();
  if (d === 'mobile' || d === 'tablet') return d;
  if (rootEl?.closest?.('.bld-canvas--mobile')) return 'mobile';
  if (rootEl?.closest?.('.bld-canvas--tablet')) return 'tablet';
  return 'desktop';
}

export function warningsFromOverflowDiagnostics(overflowByNodeId = {}, device = 'desktop') {
  const out = [];
  for (const [rawId, diag] of Object.entries(overflowByNodeId || {})) {
    if (!diag || typeof diag !== 'object') continue;
    const nodeId = Number(rawId);
    if (!Number.isFinite(nodeId)) continue;
    if (diag.horizontal) {
      out.push({
        id: `resp-live-overflow-x-${nodeId}`,
        severity: device === 'mobile' ? 'critical' : 'warning',
        kind: 'responsive',
        nodeId,
        label: 'Live overflow detected (scrollWidth > clientWidth)',
        quickFix: { label: 'Set width 100%', type: 'width100', device },
      });
    }
    if (diag.flexWrapUnexpected) {
      out.push({
        id: `resp-live-flex-wrap-${nodeId}`,
        severity: 'warning',
        kind: 'responsive',
        nodeId,
        label: 'Flex children wrapped unexpectedly (nowrap row)',
        quickFix: { label: 'Enable wrap', type: 'enableWrap', device },
      });
    }
    if (diag.vertical) {
      out.push({
        id: `resp-live-overflow-y-${nodeId}`,
        severity: 'suggestion',
        kind: 'responsive',
        nodeId,
        label: 'Vertical overflow detected on node',
      });
    }
  }
  return out;
}

function treeNodeType(tree, nodeId) {
  const n = findNodeInTree(Array.isArray(tree) ? tree : [], Number(nodeId));
  return n?.nodeType || null;
}

export function computeDomAudits({ device, mediaMetaByUrl, tree, overflowByNodeId = null }) {
  const warnings = [];

  const root = document.querySelector('.bld-canvas__live-mirror .live-doc') || document.querySelector('.bld-canvas__live-mirror') || document.querySelector('.bld-canvas__page');
  if (!root) return { warnings, effectiveDevice: device };

  const effectiveDevice = resolveAuditDevice(device, root);

  const rootRect = root.getBoundingClientRect();
  const nodeEls = [...root.querySelectorAll('[data-bld-node]')];

  // Responsive: horizontal overflow — mapped fixes (nowrap wrap → stack mobile → font → width 100%)
  for (const el of nodeEls) {
    const nodeId = el.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const { outsideX } = classifyOverflow(el, rootRect);
    if (!outsideX) continue;
    const cs = window.getComputedStyle(el);
    const disp = cs.display;
    const isFlex = disp === 'flex' || disp === 'inline-flex';
    const flexWrap = cs.flexWrap || 'nowrap';
    const flexDir = cs.flexDirection || 'row';

    if (isFlex && flexWrap === 'nowrap') {
      warnings.push({
        id: `resp-flex-nowrap-overflow-${nodeId}`,
        severity: effectiveDevice === 'mobile' ? 'critical' : 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Flex row with nowrap may overflow horizontally',
        quickFix: {
          label: 'Enable wrap',
          type: 'enableWrap',
          device,
        },
      });
      continue;
    }
    if (effectiveDevice === 'mobile' && isFlex && (flexDir === 'row' || flexDir === 'row-reverse')) {
      warnings.push({
        id: `resp-mobile-row-overflow-${nodeId}`,
        severity: 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Row layout overflows viewport on mobile',
        quickFix: {
          label: 'Stack on mobile',
          type: 'stackMobile',
        },
      });
      continue;
    }
    if (effectiveDevice === 'mobile') {
      const fs = parsePx(cs.fontSize);
      if (fs >= 18) {
        warnings.push({
          id: `resp-font-large-overflow-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Large type on mobile may worsen overflow (${fs}px)`,
          quickFix: {
            label: 'Reduce font on mobile',
            type: 'reduceFontMobile',
            valuePx: Math.max(14, Math.round(fs - 4)),
          },
        });
        continue;
      }
    }
    warnings.push({
      id: `resp-outside-x-${nodeId}`,
      severity: effectiveDevice === 'mobile' ? 'critical' : 'warning',
      kind: 'responsive',
      nodeId: Number(nodeId),
      label: 'Element extends beyond viewport (horizontal overflow)',
      quickFix: {
        label: 'Set width 100%',
        type: 'width100',
        device,
      },
    });
  }

  // Clipped content: overflow hidden + scrollWidth larger than clientWidth
  for (const el of nodeEls) {
    const nodeId = el.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const cs = window.getComputedStyle(el);
    const overflowX = cs.overflowX;
    if ((overflowX === 'hidden' || overflowX === 'clip') && el.scrollWidth > el.clientWidth + 2) {
      warnings.push({
        id: `resp-clipped-${nodeId}`,
        severity: 'warning',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Content may be clipped (overflow hidden/clip with scrollWidth > clientWidth)',
      });
    }
  }

  // Tap targets: buttons/links/inputs smaller than 44px
  const tappables = [...root.querySelectorAll('button,a,input,select,textarea,[role="button"]')];
  for (const el of tappables) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    if (rect.width >= 44 && rect.height >= 44) continue;
    const host = el.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    warnings.push({
      id: `a11y-tap-${nodeId}-${Math.round(rect.width)}x${Math.round(rect.height)}`,
      severity: 'suggestion',
      kind: 'a11y',
      nodeId: Number(nodeId),
      label: `Tiny tap target (${Math.round(rect.width)}×${Math.round(rect.height)}px)`,
    });
  }

  // Unreadable font sizes on mobile (< 12px)
  if (effectiveDevice === 'mobile') {
    for (const el of nodeEls) {
      const nodeId = el.getAttribute('data-bld-node');
      if (!nodeId) continue;
      const cs = window.getComputedStyle(el);
      const fs = parsePx(cs.fontSize);
      if (fs > 0 && fs < 12) {
        warnings.push({
          id: `resp-font-small-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Unreadable font size on mobile (${fs.toFixed(1)}px)`,
          quickFix: {
            label: 'Improve readability (mobile font)',
            type: 'reduceFontMobile',
            valuePx: 14,
          },
        });
      }
    }
  }

  // Oversized gaps/padding on mobile
  if (effectiveDevice === 'mobile') {
    for (const el of nodeEls) {
      const nodeId = el.getAttribute('data-bld-node');
      if (!nodeId) continue;
      const cs = window.getComputedStyle(el);
      const gap = parsePx(cs.gap);
      const padL = parsePx(cs.paddingLeft);
      const padR = parsePx(cs.paddingRight);
      const ml = parsePx(cs.marginLeft);
      const mr = parsePx(cs.marginRight);
      if (ml + mr >= rootRect.width * 0.22) {
        warnings.push({
          id: `resp-margin-large-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: 'Large horizontal margin on mobile',
          quickFix: {
            label: 'Reduce margin',
            type: 'reduceMargin',
            device: 'mobile',
            valuePx: 8,
          },
        });
      }
      if (gap >= 40) {
        warnings.push({
          id: `perf-gap-big-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: `Large gap on mobile (${gap}px)`,
          quickFix: {
            label: 'Reduce gap',
            type: 'reduceGap',
            device: 'mobile',
            valuePx: 16,
          },
        });
      }
      if (padL + padR >= rootRect.width * 0.4) {
        warnings.push({
          id: `resp-pad-big-${nodeId}`,
          severity: 'suggestion',
          kind: 'responsive',
          nodeId: Number(nodeId),
          label: 'Large horizontal padding on mobile',
          quickFix: {
            label: 'Reduce padding',
            type: 'reducePadding',
            device: 'mobile',
            valuePx: Math.max(12, Math.round((padL + padR) / 6) || 16),
          },
        });
      }
    }
  }

  // CLS risk: images without reserved height (very heuristic)
  const imgs = [...root.querySelectorAll('img')];
  for (const img of imgs) {
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const host = img.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const src = String(img.currentSrc || img.src || '');
    let meta = null;
    if (mediaMetaByUrl && src) {
      let pathKey = '';
      try {
        pathKey = new URL(src, window.location.href).pathname;
      } catch {
        pathKey = '';
      }
      meta = mediaMetaByUrl.get(src) || (pathKey ? mediaMetaByUrl.get(pathKey) : null) || null;
    }
    if (!img.getAttribute('width') && !img.getAttribute('height')) {
      const clsBase = {
        id: `cls-img-dims-${nodeId}`,
        severity: 'suggestion',
        kind: 'cls',
        nodeId: Number(nodeId),
        label: 'Image missing explicit width/height attributes (CLS risk)',
      };
      if (meta?.width && meta?.height) {
        warnings.push({
          ...clsBase,
          quickFix: {
            label: 'Apply aspect ratio from metadata',
            type: 'applyAspectRatio',
            device: 'desktop',
            width: meta.width,
            height: meta.height,
          },
        });
      } else {
        warnings.push({
          ...clsBase,
          fixUnavailableReason: 'No width/height in media metadata for this URL.',
        });
      }
    }
    if (meta?.bytes && meta.bytes > 1_500_000) {
      warnings.push({
        id: `perf-img-large-${nodeId}`,
        severity: meta.bytes > 3_000_000 ? 'warning' : 'suggestion',
        kind: 'performance',
        nodeId: Number(nodeId),
        label: `Large image file (${Math.round(meta.bytes / 1024)} KB)`,
      });
    }
    if (meta?.width && meta?.height) {
      const rw = rect.width;
      const rh = rect.height;
      if (rw > 0 && rh > 0 && (meta.width > rw * 2 || meta.height > rh * 2)) {
        warnings.push({
          id: `perf-img-oversized-dims-${nodeId}`,
          severity: 'suggestion',
          kind: 'performance',
          nodeId: Number(nodeId),
          label: `Image dimensions larger than rendered (${meta.width}×${meta.height} vs ~${Math.round(rw)}×${Math.round(rh)})`,
        });
      }
    }
    if (
      meta?.mimeType &&
      !String(meta.mimeType).includes('webp') &&
      !String(meta.mimeType).includes('avif') &&
      meta?.bytes > 800_000
    ) {
      warnings.push({
        id: `perf-img-modern-${nodeId}`,
        severity: 'suggestion',
        kind: 'performance',
        nodeId: Number(nodeId),
        label: 'Consider modern image format (webp/avif)',
      });
    }
  }

  // Carousel: scroll overflow + unstable height (heuristics)
  const carouselHosts = [...root.querySelectorAll('[data-bld-node]')].filter((el) => {
    // runtime carousel tends to include class 'live-carousel' but we stay generic: check for descendants with aria-roledescription or known classes
    return el.querySelector('.live-carousel') || el.querySelector('[data-carousel]') || el.querySelector('.live-carousel__track');
  });
  for (const host of carouselHosts) {
    const nodeId = host.getAttribute('data-bld-node');
    if (!nodeId) continue;
    if (host.scrollWidth > host.clientWidth + 2) {
      const nType = treeNodeType(tree, nodeId);
      const row = {
        id: `resp-carousel-overflow-${nodeId}`,
        severity: effectiveDevice === 'mobile' ? 'warning' : 'suggestion',
        kind: 'responsive',
        nodeId: Number(nodeId),
        label: 'Carousel may overflow horizontally',
      };
      if (nType === 'carousel') {
        row.quickFix = {
          label: 'Set mobile slidesPerView = 1',
          type: 'reduceSlidesPerViewMobile',
        };
      } else {
        row.fixUnavailableReason = 'Quick-fix applies to carousel nodes only.';
      }
      warnings.push(row);
    }
    const h = host.getBoundingClientRect().height;
    if (h < 120) {
      warnings.push({
        id: `cls-carousel-height-${nodeId}`,
        severity: 'suggestion',
        kind: 'cls',
        nodeId: Number(nodeId),
        label: 'Carousel height is small/unstable risk (consider fixed height/aspect)',
        quickFix: {
          label: 'Set minimum height',
          type: 'setMinHeightCls',
          valuePx: 240,
          device,
        },
      });
    }
  }

  // Contrast risk (computed, heuristic)
  const textEls = [...root.querySelectorAll('h1,h2,h3,p,button,a,span')];
  const parseRgb = (c) => {
    const m = String(c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  };
  const lum = (rgb) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
  };
  const contrastRatio = (fg, bg) => {
    const L1 = lum(fg);
    const L2 = lum(bg);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const el of textEls) {
    const host = el.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const cs = window.getComputedStyle(el);
    const fg = parseRgb(cs.color);
    if (!fg) continue;
    // Find a non-transparent background up the tree (best effort)
    let bg = null;
    let cur = el;
    for (let i = 0; i < 6 && cur; i += 1) {
      const ccs = window.getComputedStyle(cur);
      const b = parseRgb(ccs.backgroundColor);
      if (b && !String(ccs.backgroundColor).includes('rgba(0, 0, 0, 0)') && ccs.backgroundColor !== 'transparent') {
        bg = b;
        break;
      }
      cur = cur.parentElement;
    }
    if (!bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      warnings.push({
        id: `a11y-contrast-${nodeId}-${Math.round(ratio * 10)}`,
        severity: ratio < 3 ? 'warning' : 'suggestion',
        kind: 'a11y',
        nodeId: Number(nodeId),
        label: `Low contrast risk (ratio ${ratio.toFixed(2)})`,
      });
    }
  }

  // Shadow / filter / animation density (computed styles)
  let shadowCount = 0;
  let filterCount = 0;
  let animatedCount = 0;
  let hoverMotionCount = 0;
  for (const el of nodeEls) {
    const cs = window.getComputedStyle(el);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadowCount += 1;
    if (cs.filter && cs.filter !== 'none') filterCount += 1;
    if (cs.animationName && cs.animationName !== 'none') animatedCount += 1;
    const tp = String(cs.transitionProperty || '');
    if (tp.includes('transform')) hoverMotionCount += 1;
  }
  if (shadowCount > 40) {
    warnings.push({
      id: `perf-shadow-density`,
      severity: shadowCount > 80 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many elements with box-shadow (${shadowCount})`,
    });
  }
  if (filterCount > 20) {
    warnings.push({
      id: `perf-filter-density`,
      severity: filterCount > 40 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many elements using CSS filters (${filterCount})`,
    });
  }
  if (animatedCount > 18) {
    warnings.push({
      id: `perf-animation-density`,
      severity: animatedCount > 40 ? 'warning' : 'suggestion',
      kind: 'performance',
      label: `Many animated elements (${animatedCount})`,
    });
  }
  if (hoverMotionCount > 60) {
    warnings.push({
      id: `perf-hover-motion-density`,
      severity: 'suggestion',
      kind: 'performance',
      label: `Many elements transition transform (${hoverMotionCount})`,
    });
  }

  // Focus indicator risk (heuristic: interactive elements with outline suppressed)
  const interactiveEls = [...root.querySelectorAll('button,a,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])')];
  for (const el of interactiveEls) {
    const host = el.closest('[data-bld-node]');
    const nodeId = host?.getAttribute('data-bld-node');
    if (!nodeId) continue;
    const cs = window.getComputedStyle(el);
    const outlineNone = (cs.outlineStyle === 'none' || parsePx(cs.outlineWidth) === 0);
    const hasFocusRingClass = el.classList?.contains('live-node--ix') || el.closest?.('.live-node--ix');
    if (outlineNone && !hasFocusRingClass) {
      warnings.push({
        id: `a11y-focus-ring-${nodeId}-${el.tagName}`,
        severity: 'suggestion',
        kind: 'a11y',
        nodeId: Number(nodeId),
        label: 'Interactive element may lack visible focus indicator',
      });
    }
  }

  if (overflowByNodeId && typeof overflowByNodeId === 'object') {
    warnings.push(...warningsFromOverflowDiagnostics(overflowByNodeId, effectiveDevice));
  }

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReduced && animatedCount > 0) {
    warnings.push({
      id: 'a11y-reduced-motion-animations',
      severity: 'warning',
      kind: 'a11y',
      label: `Animations active while prefers-reduced-motion is on (${animatedCount})`,
      quickFix: { label: 'Reduce animation intensity', type: 'reduceAnimationIntensity', pageLevel: true },
    });
  }

  const animDensity = warnings.find((w) => w.id === 'perf-animation-density');
  if (animDensity) {
    animDensity.quickFix = {
      label: 'Reduce animation intensity',
      type: 'reduceAnimationIntensity',
      pageLevel: true,
    };
  }

  const seen = new Set();
  const deduped = warnings.filter((w) => {
    if (!w?.id || seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  return { warnings: deduped, effectiveDevice };
}

