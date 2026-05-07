import { withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { mergeDeviceStyleWithTypeDefaults } from '@/lib/nodeLayoutDefaults';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { getDeviceStyle, styleToCss } from '@/lib/styleToCss';
import { DEFAULT_SITE_THEME } from '@/lib/siteDesignTheme';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const DEVICE = 'desktop';

function pickHeadingTag(tag) {
  const t = typeof tag === 'string' ? tag.toLowerCase() : 'h2';
  return HEADING_TAGS.has(t) ? t : 'h2';
}

function containerCss(node) {
  let deviceStyle = getDeviceStyle(node.style_json, DEVICE);
  if (node.nodeType === 'stack' && node.props?.direction === 'horizontal') {
    deviceStyle = {
      ...deviceStyle,
      layout: { ...deviceStyle.layout, flexDirection: 'row' },
    };
  }
  const resolved = withResolvedLayoutGap(deviceStyle, DEFAULT_SITE_THEME);
  return styleToCss(mergeDeviceStyleWithTypeDefaults(node.nodeType, resolved), DEFAULT_SITE_THEME);
}

function leafCss(node) {
  const resolved = withResolvedLayoutGap(getDeviceStyle(node.style_json, DEVICE), DEFAULT_SITE_THEME);
  return styleToCss(mergeDeviceStyleWithTypeDefaults(node.nodeType, resolved), DEFAULT_SITE_THEME);
}

export default function LiveNode({ node }) {
  if (!node?.nodeType) return null;

  const { nodeType, props = {}, children = [] } = node;
  const childList = Array.isArray(children) ? children : [];

  if (nodeType === 'row' || nodeType === 'column' || nodeType === 'stack') {
    return (
      <div className="live-node" data-node-type={nodeType} style={containerCss(node)}>
        {childList.map((child, i) => (
          <LiveNode key={String(child.id ?? `${nodeType}-${i}`)} node={child} />
        ))}
      </div>
    );
  }

  if (nodeType === 'heading') {
    const Tag = pickHeadingTag(props.tag);
    const css = leafCss(node);
    return <Tag style={css}>{props.text || ''}</Tag>;
  }

  if (nodeType === 'text') {
    return (
      <p style={leafCss(node)}>
        {props.text || ''}
      </p>
    );
  }

  if (nodeType === 'rich_text') {
    const css = leafCss(node);
    const anim = getRichTextAnimationStyle(props?.animation || {});
    return (
      <div
        className={`live-node live-rich-text ${anim.className}`.trim()}
        style={{ ...(css || {}), ...(anim.style || {}) }}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(props?.content || '<p></p>') }}
      />
    );
  }

  if (nodeType === 'button') {
    const text = props.text || 'Button';
    const css = leafCss(node);
    if (props.href && typeof props.href === 'string') {
      return (
        <a href={props.href} style={css}>
          {text}
        </a>
      );
    }
    return (
      <button type="button" style={css}>
        {text}
      </button>
    );
  }

  if (nodeType === 'image') {
    const src = props.src || '';
    const alt = props.alt || '';
    if (!src) return null;
    return <img src={src} alt={alt} style={leafCss(node)} loading="lazy" />;
  }

  return null;
}
