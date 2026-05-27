'use client';

import { useState } from 'react';
import { useBuilderTheme } from '@/context/BuilderThemeContext';
import { defaultPageBreakpointVars } from '@/lib/applyPageResponsiveDefaults';
import { InspectorNumField } from '@/components/builder/inspector/InspectorNumeric';

const BREAKPOINTS = [
  { id: 'desktop', label: 'Desktop (default)' },
  { id: 'tablet', label: 'Tablet ≤1024px' },
  { id: 'mobile', label: 'Mobile ≤767px' },
];

/**
 * Page-level responsive controls (any page) + bulk apply section defaults.
 */
export default function PageResponsivePanel({
  onApplyResponsiveToPage,
  isApplying = false,
  pageTree = [],
}) {
  const { siteTheme, setSiteTheme, currentPageSlug } = useBuilderTheme();
  const [bpTab, setBpTab] = useState('tablet');

  const pageVars =
    (currentPageSlug && siteTheme.pageVars && siteTheme.pageVars[currentPageSlug]) || {};
  const breakpoints =
    pageVars.breakpoints && typeof pageVars.breakpoints === 'object' ? pageVars.breakpoints : {};

  const patchBreakpointVar = (breakpoint, key, val) => {
    if (!currentPageSlug) return;
    setSiteTheme((prev) => {
      const curPage = { ...((prev.pageVars || {})[currentPageSlug] || {}) };
      const curBp = { ...(curPage.breakpoints || {}) };
      const layer = { ...(curBp[breakpoint] || {}) };
      if (val == null) delete layer[key];
      else layer[key] = val;
      curBp[breakpoint] = layer;
      return {
        ...prev,
        pageVars: {
          ...(prev.pageVars || {}),
          [currentPageSlug]: { ...curPage, breakpoints: curBp },
        },
      };
    });
  };

  const applyBreakpointDefaults = (breakpoint) => {
    const defs = defaultPageBreakpointVars(breakpoint, siteTheme);
    Object.entries(defs).forEach(([key, val]) => patchBreakpointVar(breakpoint, key, val));
  };

  const activeBp = bpTab === 'desktop' ? null : breakpoints[bpTab] || {};
  const rootCount = Array.isArray(pageTree) ? pageTree.filter((n) => n?.nodeType === 'row').length : 0;

  return (
    <div className="bld-page-responsive">
      <p className="bld-field-note" style={{ marginTop: 0 }}>
        Har page ke liye alag tablet/mobile spacing aur width. Section layout ke liye neeche buttons use
        karo — phir top bar se <strong>Tablet</strong> / <strong>Mobile</strong> preview check karo.
      </p>

      <div className="bld-inspector-device__pills" role="tablist" aria-label="Page breakpoint settings">
        {BREAKPOINTS.filter((b) => b.id !== 'desktop').map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={bpTab === b.id}
            className={`bld-inspector-device__pill ${bpTab === b.id ? 'is-active' : ''}`}
            onClick={() => setBpTab(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {bpTab !== 'desktop' ? (
        <div className="bld-acc__body" style={{ marginTop: 12 }}>
          <InspectorNumField
            id={`page-bp-${bpTab}-gap`}
            label="Section gap between strips"
            placeholder="Uses desktop if empty"
            value={activeBp.sectionGapPx}
            onChange={(v) => patchBreakpointVar(bpTab, 'sectionGapPx', v)}
            min={0}
            max={120}
          />
          <InspectorNumField
            id={`page-bp-${bpTab}-pad`}
            label="Default padding below each strip"
            placeholder="Uses desktop if empty"
            value={activeBp.sectionPadBottomPx}
            onChange={(v) => patchBreakpointVar(bpTab, 'sectionPadBottomPx', v)}
            min={0}
            max={120}
          />
          <InspectorNumField
            id={`page-bp-${bpTab}-width`}
            label="Max content width (px)"
            placeholder={bpTab === 'mobile' ? 'Empty = full width' : '960 suggested'}
            value={activeBp.contentMaxWidthPx}
            onChange={(v) => patchBreakpointVar(bpTab, 'contentMaxWidthPx', v)}
            min={320}
            max={2560}
          />
          <button
            type="button"
            className="bld-chip"
            style={{ marginTop: 8 }}
            onClick={() => applyBreakpointDefaults(bpTab)}
          >
            Use recommended {bpTab} page defaults
          </button>
        </div>
      ) : null}

      <div className="bld-panel__subhead" style={{ marginTop: 20, marginBottom: 8 }}>
        All sections on this page ({rootCount} rows)
      </div>
      <p className="bld-field-note">
        Stacks columns on mobile, wraps on tablet, scales large headings, and fixes header/footer. Safe to
        run again — merges into existing mobile/tablet layers.
      </p>
      <div className="bld-acc__body bld-acc__body--grid">
        <button
          type="button"
          className="bld-block-card"
          disabled={isApplying || !rootCount}
          onClick={() => onApplyResponsiveToPage?.({ mobile: true, tablet: true })}
        >
          <span className="bld-block-card__icon">📱</span>
          <span className="bld-block-card__label">Apply mobile + tablet</span>
        </button>
        <button
          type="button"
          className="bld-block-card"
          disabled={isApplying || !rootCount}
          onClick={() => onApplyResponsiveToPage?.({ mobile: true, tablet: false })}
        >
          <span className="bld-block-card__icon">M</span>
          <span className="bld-block-card__label">Mobile only</span>
        </button>
        <button
          type="button"
          className="bld-block-card"
          disabled={isApplying || !rootCount}
          onClick={() => onApplyResponsiveToPage?.({ mobile: false, tablet: true })}
        >
          <span className="bld-block-card__icon">T</span>
          <span className="bld-block-card__label">Tablet only</span>
        </button>
      </div>
    </div>
  );
}
