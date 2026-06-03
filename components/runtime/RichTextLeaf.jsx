import { normalizeHeadingLevel } from '@/lib/headingLevel';
import { sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import {
  normalizeInlineTextProps,
  resolveInlineTextHtml,
} from '@/lib/richTextNodeProps';
import TextEffectsWrap from '@/components/runtime/TextEffectsWrap';

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
    html ? 'bld-rich-text--html bld-rich-content' : '',
    normalized.marquee.enabled ? 'bld-rich-text--marquee-scroll' : '',
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

  return (
    <TextEffectsWrap props={props} style={style}>
      {inner}
    </TextEffectsWrap>
  );
}
