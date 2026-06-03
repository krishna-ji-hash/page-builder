import { LiveIcon } from '@/components/runtime/AdvancedElement';
import RichTextMarquee from '@/components/runtime/RichTextMarquee';
import { marqueeTextAlignFromStyle, splitStylesForTextMarquee } from '@/lib/marqueeTextStyles';
import { marqueeStyleFromProps, normalizeInlineTextProps } from '@/lib/richTextNodeProps';

function iconGlyphStyle(icon) {
  if (!icon?.enabled) return undefined;
  const style = {
    fontSize: `${icon.size}px`,
    marginRight: icon.position === 'before' ? `${icon.spacing}px` : undefined,
    marginLeft: icon.position === 'after' ? `${icon.spacing}px` : undefined,
    flexShrink: 0,
  };
  if (icon.color) style.color = icon.color;
  return style;
}

function renderIconGlyph(icon) {
  const posClass = icon.position === 'after' ? 'bld-icon-after' : 'bld-icon-before';
  return (
    <span
      className={`bld-inline-icon bld-rich-text-icon ${posClass}`}
      style={iconGlyphStyle(icon)}
      aria-hidden={!icon.name}
    >
      <LiveIcon symbol={icon.name} ariaLabel="" />
    </span>
  );
}

function withIconWrap(icon, children, marqueeMode = false) {
  if (!icon?.enabled) return children;
  const wrapClass = marqueeMode
    ? 'bld-rich-text-icon-wrap bld-rich-text-icon-wrap--marquee'
    : 'bld-rich-text-icon-wrap';
  return (
    <span
      className={wrapClass}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: marqueeMode ? undefined : '100%',
      }}
    >
      {icon.position === 'before' ? renderIconGlyph(icon) : null}
      {children}
      {icon.position === 'after' ? renderIconGlyph(icon) : null}
    </span>
  );
}

/**
 * Optional icon + CSS marquee around any text content (plain, rich inline, or block rich_text).
 */
export default function TextEffectsWrap({ props = {}, style, children }) {
  const normalized = normalizeInlineTextProps(props);
  const withIcon = withIconWrap(normalized.icon, children, false);
  const marquee = normalized.marquee;

  if (!marquee.enabled) {
    return withIcon;
  }

  const { shellStyle } = splitStylesForTextMarquee(style);
  const scrollingInner = withIconWrap(normalized.icon, children, true);
  const marqueeVars = marqueeStyleFromProps(marquee);
  const direction = marquee.direction === 'right' ? 'right' : 'left';
  const dirClass = direction === 'right' ? 'bld-marquee-right' : 'bld-marquee-left';
  const pauseClass = marquee.pauseOnHover !== false ? 'bld-marquee-pause-hover' : 'bld-rich-text-marquee--no-pause';
  const mobileClass = marquee.mobileEnabled ? '' : 'bld-marquee-mobile-off bld-rich-text-marquee--mobile-off';
  const marqueeClasses = [
    'bld-marquee',
    'bld-rich-text-marquee',
    dirClass,
    pauseClass,
    marquee.loop === false ? 'bld-rich-text-marquee--once' : '',
    mobileClass,
  ]
    .filter(Boolean)
    .join(' ');

  const marqueeTextAlign = marqueeTextAlignFromStyle(style);

  return (
    <RichTextMarquee
      marquee={marquee}
      direction={direction}
      textAlign={marqueeTextAlign}
      className={marqueeClasses}
      style={{ ...(marqueeVars || {}), ...shellStyle }}
    >
      {scrollingInner}
    </RichTextMarquee>
  );
}
