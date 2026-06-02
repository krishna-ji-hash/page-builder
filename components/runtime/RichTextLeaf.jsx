import { LiveIcon } from '@/components/runtime/AdvancedElement';
import RichTextMarquee from '@/components/runtime/RichTextMarquee';
import { normalizeHeadingLevel } from '@/lib/headingLevel';
import { sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { marqueeTextAlignFromStyle, splitStylesForTextMarquee } from '@/lib/marqueeTextStyles';
import {
  marqueeStyleFromProps,
  normalizeInlineTextProps,
  resolveInlineTextHtml,
} from '@/lib/richTextNodeProps';

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

function renderInnerContent({ Tag, html, plain, className, style, sanitizeOptions }) {
  if (html) {
    const safe = sanitizeInlineLeafHtml(html, sanitizeOptions) || '';
    return (
      <Tag
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  return (
    <Tag className={className} style={style}>
      {plain}
    </Tag>
  );
}

/**
 * Shared rich text + optional icon + marquee wrapper (builder live mirror + published).
 */
export default function RichTextLeaf({
  nodeType = 'text',
  props = {},
  style,
  className = '',
  tag: tagOverride,
  sanitizeOptions = {},
}) {
  const normalized = normalizeInlineTextProps(props);
  const html = resolveInlineTextHtml(normalized);
  const plain =
    normalized.richText.plainText ||
    normalized.text ||
    (html ? '' : '');
  const textTagRaw = String(props?.tag || '').toLowerCase().trim();
  const textTag =
    textTagRaw === 'span' || textTagRaw === 'div' || textTagRaw === 'p' ? textTagRaw : 'p';
  const Tag =
    tagOverride ||
    (nodeType === 'heading' ? normalizeHeadingLevel(props?.tag, 'h2') : textTag);

  const richClass = [
    'bld-rich-text',
    html ? 'bld-rich-text--html' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inner = renderInnerContent({
    Tag,
    html,
    plain,
    className: richClass,
    style,
    sanitizeOptions,
  });

  const withIcon = normalized.icon.enabled ? (
    <span className="bld-rich-text-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
      {normalized.icon.position === 'before' ? (
        <span className="bld-rich-text-icon" style={iconGlyphStyle(normalized.icon)}>
          <LiveIcon symbol={normalized.icon.name} ariaLabel="" />
        </span>
      ) : null}
      {inner}
      {normalized.icon.position === 'after' ? (
        <span className="bld-rich-text-icon" style={iconGlyphStyle(normalized.icon)}>
          <LiveIcon symbol={normalized.icon.name} ariaLabel="" />
        </span>
      ) : null}
    </span>
  ) : (
    inner
  );

  const marquee = normalized.marquee;
  if (!marquee.enabled) {
    return withIcon;
  }

  const { shellStyle, textStyle } = splitStylesForTextMarquee(style);
  const scrollingInner = renderInnerContent({
    Tag,
    html,
    plain,
    className: [richClass, 'bld-rich-text--marquee-scroll'].filter(Boolean).join(' '),
    style: textStyle,
    sanitizeOptions,
  });
  const scrollingWithIcon = normalized.icon.enabled ? (
    <span
      className="bld-rich-text-icon-wrap bld-rich-text-icon-wrap--marquee"
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      {normalized.icon.position === 'before' ? (
        <span className="bld-rich-text-icon" style={iconGlyphStyle(normalized.icon)}>
          <LiveIcon symbol={normalized.icon.name} ariaLabel="" />
        </span>
      ) : null}
      {scrollingInner}
      {normalized.icon.position === 'after' ? (
        <span className="bld-rich-text-icon" style={iconGlyphStyle(normalized.icon)}>
          <LiveIcon symbol={normalized.icon.name} ariaLabel="" />
        </span>
      ) : null}
    </span>
  ) : (
    scrollingInner
  );

  const marqueeVars = marqueeStyleFromProps(marquee);
  const direction = marquee.direction === 'right' ? 'right' : 'left';
  const dirClass = direction === 'right' ? 'bld-marquee-right' : 'bld-marquee-left';
  const marqueeClasses = [
    'bld-rich-text-marquee',
    dirClass,
    marquee.pauseOnHover ? '' : 'bld-rich-text-marquee--no-pause',
    marquee.loop === false ? 'bld-rich-text-marquee--once' : '',
    marquee.mobileEnabled ? '' : 'bld-rich-text-marquee--mobile-off',
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
      {scrollingWithIcon}
    </RichTextMarquee>
  );
}
