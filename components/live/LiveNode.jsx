import { withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { imageFitMode, mergeImageFigureStyleForContain } from '@/lib/imageFigureStyle';
import { normalizeHeadingLevel } from '@/lib/headingLevel';
import { mergeDeviceStyleWithTypeDefaults } from '@/lib/nodeLayoutDefaults';
import { finalizeLeafDeviceStyle } from '@/lib/leafStylePipeline';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { isProbablyInlineHtml, sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import { getDeviceStyle, styleToCss } from '@/lib/styleToCss';
import { DEFAULT_SITE_THEME, mergeNodeStyleWithSiteTheme } from '@/lib/siteDesignTheme';

const DEVICE = 'desktop';

function styleJsonToCss(node, deviceStyle) {
  const themed = mergeNodeStyleWithSiteTheme(deviceStyle, DEFAULT_SITE_THEME, node.nodeType);
  const gapReady = withResolvedLayoutGap(themed, DEFAULT_SITE_THEME);
  const merged = mergeDeviceStyleWithTypeDefaults(node.nodeType, gapReady, { treeNode: node });
  return styleToCss(finalizeLeafDeviceStyle(node, DEVICE, merged), DEFAULT_SITE_THEME);
}

function containerCss(node) {
  let deviceStyle = getDeviceStyle(node.style_json, DEVICE);
  if (node.nodeType === 'stack' && node.props?.direction === 'horizontal') {
    deviceStyle = {
      ...deviceStyle,
      layout: { ...deviceStyle.layout, flexDirection: 'row' },
    };
  }
  return styleJsonToCss(node, deviceStyle);
}

function leafCss(node) {
  return styleJsonToCss(node, getDeviceStyle(node.style_json, DEVICE));
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
    const Tag = normalizeHeadingLevel(props.tag, 'h2');
    const css = leafCss(node);
    const raw = props.text || '';
    if (isProbablyInlineHtml(raw)) {
      return (
        <Tag
          style={css}
          dangerouslySetInnerHTML={{ __html: sanitizeInlineLeafHtml(raw) || '' }}
        />
      );
    }
    return <Tag style={css}>{raw}</Tag>;
  }

  if (nodeType === 'text') {
    const css = leafCss(node);
    const raw = props.text || '';
    if (isProbablyInlineHtml(raw)) {
      return (
        <p
          style={css}
          dangerouslySetInnerHTML={{ __html: sanitizeInlineLeafHtml(raw) || '' }}
        />
      );
    }
    return <p style={css}>{raw}</p>;
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
    const css = { ...(leafCss(node) || {}) };
    if (imageFitMode(props.imageFit) === 'contain') {
      Object.assign(css, mergeImageFigureStyleForContain(css));
    }
    const imageHeightPx = Number(props.imageHeightPx || 0);
    const img = (
      <img
        src={src}
        alt={alt}
        style={{
          ...css,
          objectFit: props.imageFit || 'cover',
          ...(imageHeightPx > 0 ? { height: `${imageHeightPx}px` } : {}),
        }}
        loading="lazy"
      />
    );
    const href = typeof props.href === 'string' ? props.href : '';
    if (!href) return img;
    const open = Boolean(props.openInNewTab);
    return (
      <a href={href} target={open ? '_blank' : undefined} rel={open ? 'noreferrer noopener' : undefined}>
        {img}
      </a>
    );
  }

  return null;
}
