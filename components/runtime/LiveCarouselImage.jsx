'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  canOptimizeCarouselImageWithNext,
  logCarouselLcpDiagnostic,
} from '@/lib/liveCarouselImage';

/**
 * Carousel slide image — next/image when optimizable, native img fallback otherwise.
 * Preserves object-fit / crop via inline style contract from Carousel.jsx.
 */
export default function LiveCarouselImage({
  src,
  alt = '',
  className = '',
  style,
  priority = false,
  loading,
  fetchPriority,
  decoding = 'async',
  sizes,
  width,
  height,
  variant,
  slideIndex = 0,
  fill = false,
}) {
  const loggedRef = useRef(false);
  const useNext = canOptimizeCarouselImageWithNext(src);

  useEffect(() => {
    if (loggedRef.current || !priority) return;
    loggedRef.current = true;
    logCarouselLcpDiagnostic({ src, priority, variant, slideIndex });
  }, [src, priority, variant, slideIndex]);

  const resolvedLoading = priority ? 'eager' : loading || 'lazy';
  const resolvedFetchPriority = priority ? 'high' : fetchPriority || 'low';

  if (!useNext) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        style={style}
        width={width}
        height={height}
        loading={resolvedLoading}
        fetchPriority={resolvedFetchPriority}
        decoding={decoding}
      />
    );
  }

  const imgStyle = {
    ...(style && typeof style === 'object' ? style : {}),
    objectFit: style?.objectFit || undefined,
    objectPosition: style?.objectPosition || undefined,
  };

  if (fill) {
    return (
      <Image
        className={className}
        src={src}
        alt={alt}
        fill
        sizes={sizes || '100vw'}
        priority={priority}
        loading={resolvedLoading}
        fetchPriority={resolvedFetchPriority}
        decoding={decoding}
        style={imgStyle}
      />
    );
  }

  const w = Math.max(1, Math.round(Number(width) || 1280));
  const h = Math.max(1, Math.round(Number(height) || 720));

  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes || '100vw'}
      priority={priority}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      decoding={decoding}
      style={imgStyle}
    />
  );
}
