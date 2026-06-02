'use client';

import {
  brandLogoHasRenderableUrl,
  normalizeBrandLogoProps,
  parseBrandLogoWidthPx,
  pickBrandLogoSrcForTone,
  resolveBrandLogoActiveTone,
} from '@/lib/headerLogo';

/**
 * Renders a single brand logo for the active light/dark context (no double-stack).
 */
export default function HeaderBrandLogo({
  props: nodeProps = {},
  className = '',
  href: hrefOverride,
  widthPx: widthPxOverride,
  imgClassName = '',
  imgStyle = {},
  wrapperStyle = {},
  linkStyle = {},
  activeTone: activeToneOverride,
  siteTheme = null,
  themeTokens = null,
  sectionTone = null,
  builderTree = null,
  nodeId = null,
  device = 'desktop',
  inSiteHeader = false,
}) {
  const normalized = normalizeBrandLogoProps(nodeProps);
  if (!brandLogoHasRenderableUrl(normalized)) return null;

  const activeTone =
    activeToneOverride === 'light' || activeToneOverride === 'dark'
      ? activeToneOverride
      : resolveBrandLogoActiveTone({
          normalized,
          siteTheme,
          themeTokens,
          sectionTone,
          tree: builderTree,
          nodeId,
          device,
          inSiteHeader,
        });

  const src = pickBrandLogoSrcForTone(normalized, activeTone);
  if (!src) return null;

  const href = hrefOverride ?? (normalized.link || undefined);
  const widthPx = widthPxOverride ?? parseBrandLogoWidthPx(normalized.width, 160);
  const height = normalized.height;

  const sizeStyle = {
    width: `${widthPx}px`,
    maxWidth: '100%',
    height: height === 'auto' || height === '' || height == null ? 'auto' : height,
    ...imgStyle,
  };

  const img = (
    <img
      key={`${activeTone}:${src}:${widthPx}`}
      src={src}
      alt={normalized.alt || 'Logo'}
      className={['bld-logo-img', imgClassName].filter(Boolean).join(' ')}
      style={sizeStyle}
      loading="lazy"
      decoding="async"
    />
  );

  const inner = href ? (
    <a className="bld-logo-link" href={href} style={linkStyle}>
      {img}
    </a>
  ) : (
    img
  );

  return (
    <div
      className={['bld-logo', className].filter(Boolean).join(' ')}
      data-logo-theme={normalized.logoTheme || 'auto'}
      data-brand-logo-tone={activeTone}
      style={wrapperStyle}
    >
      {inner}
    </div>
  );
}
