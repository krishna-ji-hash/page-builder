'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import {
  formatStatDisplayValue,
  parseStatDisplayValue,
  resolveStatsCounterProps,
} from '@/lib/statsCounterDefaults';

const COUNT_DURATION_MS = 1800;

function formatCount(value, decimals = 0) {
  if (decimals > 0) return Number(value).toFixed(decimals);
  return String(Math.round(value));
}

function StatValue({ item, animate, inView, builderEditable, onCommitValue, stopCanvasBubble, textEditBlurCommitGuard, featureTabValueSyncGuard }) {
  const numeric = item.numericValue;
  const suffix = item.suffix || '';
  const prefix = item.prefix || '';
  const displayText = item.display || (numeric == null ? String(item.value ?? '') : '');
  const [count, setCount] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!animate || !inView || numeric == null || builderEditable) return;
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    let raf = 0;
    let start = 0;
    const decimals = item.decimals ?? 0;

    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = numeric * eased;
      setCount(decimals > 0 ? Number(next.toFixed(decimals)) : Math.floor(next));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(numeric);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate, inView, numeric, item.decimals, builderEditable]);

  if (builderEditable) {
    return (
      <FeatureTabCanvasField
        as="span"
        className="live-stats-counter__value live-stats-counter__editable"
        value={formatStatDisplayValue(item)}
        blurCommitGuard={textEditBlurCommitGuard}
        valueSyncGuard={featureTabValueSyncGuard}
        onCommit={(next) => {
          const parsed = parseStatDisplayValue(next);
          onCommitValue?.(parsed);
        }}
        onPointerDown={stopCanvasBubble}
      />
    );
  }

  if (numeric == null || !animate) {
    return (
      <span className="live-stats-counter__value" aria-label={`${prefix}${displayText}${suffix}`}>
        {prefix}
        {displayText}
        {suffix && !String(displayText).endsWith(suffix) ? suffix : null}
      </span>
    );
  }

  return (
    <span className="live-stats-counter__value" aria-label={`${prefix}${numeric}${suffix}`}>
      {prefix}
      {formatCount(count, item.decimals)}
      {suffix}
    </span>
  );
}

/**
 * Three-column stats row with viewport count-up animation.
 */
export default function StatsCounter({
  items: itemsProp,
  animate: animateProp = true,
  gapPx: gapPxProp,
  builderMode = false,
  builderEditable = false,
  onPatchItem,
  textEditBlurCommitGuard = null,
  featureTabValueSyncGuard = null,
  style,
  className,
}) {
  const { items, animate, gapPx } = useMemo(
    () => resolveStatsCounterProps({ items: itemsProp, animate: animateProp, gapPx: gapPxProp }),
    [itemsProp, animateProp, gapPxProp]
  );
  const mergedStyle = useMemo(() => {
    const base = style && typeof style === 'object' ? { ...style } : {};
    if (gapPx != null && base.gap == null && base.columnGap == null) {
      base.gap = `${gapPx}px`;
    }
    return Object.keys(base).length ? base : undefined;
  }, [style, gapPx]);
  const rootRef = useRef(null);
  const [inView, setInView] = useState(builderMode);
  const rootId = useId();
  const canvasEdit = builderMode && builderEditable;
  const showAnimate = animate && !canvasEdit;

  useEffect(() => {
    if (builderMode) {
      setInView(true);
      return undefined;
    }
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [builderMode]);

  const stopCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const patchItemByIndex = useCallback(
    (index, patch) => {
      if (!onPatchItem || index < 0 || index >= items.length || !patch) return;
      onPatchItem(index, patch);
    },
    [items.length, onPatchItem]
  );

  return (
    <div
      ref={rootRef}
      id={rootId}
      className={[
        'live-stats-counter',
        builderMode ? 'live-stats-counter--builder' : '',
        canvasEdit ? 'live-stats-counter--editable' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={mergedStyle}
      data-stats-counter=""
      role="group"
      aria-label="Statistics"
    >
      {canvasEdit ? (
        <p className="live-stats-counter__builder-hint" aria-hidden>
          Click a number or label to edit · Inspector for add/remove stats
        </p>
      ) : null}
      {items.map((item, index) => (
        <div key={item.id} className="live-stats-counter__item" data-stat-index={index}>
          <StatValue
            item={item}
            animate={showAnimate}
            inView={inView}
            builderEditable={canvasEdit}
            onCommitValue={(parsed) => patchItemByIndex(index, parsed)}
            stopCanvasBubble={stopCanvasBubble}
            textEditBlurCommitGuard={textEditBlurCommitGuard}
            featureTabValueSyncGuard={featureTabValueSyncGuard}
          />
          {canvasEdit || item.label ? (
            canvasEdit ? (
              <FeatureTabCanvasField
                as="p"
                className="live-stats-counter__label live-stats-counter__editable"
                value={item.label || ''}
                blurCommitGuard={textEditBlurCommitGuard}
                valueSyncGuard={featureTabValueSyncGuard}
                onCommit={(next) => patchItemByIndex(index, { label: next })}
                onPointerDown={stopCanvasBubble}
              />
            ) : (
              <p className="live-stats-counter__label">{item.label}</p>
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
