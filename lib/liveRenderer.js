import ActionButton from '@/components/runtime/ActionButton';
import Carousel from '@/components/runtime/Carousel';
import DynamicForm from '@/components/runtime/DynamicForm';
import DynamicTable from '@/components/runtime/DynamicTable';
import Menu from '@/components/runtime/Menu';
import { mergeDeviceStyleWithTypeDefaults, mergeMenuDeviceStyle } from '@/lib/nodeLayoutDefaults';
import { getRichTextAnimationStyle } from '@/lib/richTextAnimation';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { rootSemanticTag } from '@/lib/rootSemanticTag';
import { withResolvedLayoutGap } from '@/lib/layoutGapUtils';
import { getDeviceStyle, menuCssVars, styleToCss } from '@/lib/styleToCss';
import { DEFAULT_SITE_THEME, mergeNodeStyleWithSiteTheme } from '@/lib/siteDesignTheme';

const DEFAULT_DEVICE = 'desktop';

function activeSiteTheme(options) {
  return options?.siteTheme || DEFAULT_SITE_THEME;
}

function themedDeviceStyle(node, device, options) {
  const raw = getDeviceStyle(node.style_json, device);
  const theme = activeSiteTheme(options);
  const merged = mergeNodeStyleWithSiteTheme(raw, theme, node.nodeType);
  return withResolvedLayoutGap(merged, theme);
}

function resolveDevice(options) {
  const d = options?.device;
  if (d === 'tablet' || d === 'mobile' || d === 'desktop') return d;
  return DEFAULT_DEVICE;
}

/** Builder canvas: selection + parity with NodeRenderer class names. */
function builderHitAttrs(node, options) {
  if (!options?.builderDataAttr || node?.id == null) return {};
  return { 'data-bld-node': String(node.id) };
}

function containerClassName(nodeType) {
  if (nodeType === 'row') return 'live-node bld-row';
  if (nodeType === 'column') return 'live-node bld-column';
  if (nodeType === 'stack') return 'live-node bld-stack';
  return 'live-node';
}

function leafClassName(extra = '', options) {
  const base = `live-node bld-block${extra ? ` ${extra}` : ''}`.trim();
  return options?.builderDataAttr ? base : extra ? `live-node ${extra}`.trim() : 'live-node';
}

function buttonIconGlyph(name) {
  const n = typeof name === 'string' ? name.trim().toLowerCase() : '';
  if (!n) return '';
  const map = {
    'arrow-down': '↓',
    'arrow-up': '↑',
    'arrow-left': '←',
    'arrow-right': '→',
    down: '↓',
    up: '↑',
    left: '←',
    right: '→',
    check: '✓',
    plus: '+',
    minus: '−',
    close: '×',
    x: '×',
    mail: '✉',
    phone: '☎',
    star: '★',
    search: '⌕',
  };
  return map[n] || (n.length <= 2 ? n : '');
}

function renderButtonContent(node) {
  const text = node.props?.text || 'Button';
  const iconName = node.props?.icon;
  const icon = buttonIconGlyph(iconName);
  if (!icon) return text;
  const pos = node.props?.iconPosition === 'before' ? 'before' : 'after';
  const spacing = Math.max(0, Number(node.props?.iconSpacing ?? 10) || 0);
  const iconEl = (
    <span className="bld-btn__icon" aria-hidden="true" style={{ marginRight: pos === 'before' ? spacing : 0, marginLeft: pos === 'after' ? spacing : 0 }}>
      {icon}
    </span>
  );
  return pos === 'before' ? (
    <>
      {iconEl}
      <span>{text}</span>
    </>
  ) : (
    <>
      <span>{text}</span>
      {iconEl}
    </>
  );
}

/**
 * Single node → React (same pipeline for public site, draft preview, and builder mirror).
 * @param {object} options
 * @param {'desktop'|'tablet'|'mobile'} [options.device='desktop'] — responsive style_json layer
 * @param {boolean} [options.builderDataAttr] — set `data-bld-node` + bld-* classes for builder selection
 */
export function renderNode(node, key, options = {}) {
  const { rootRowTag, currentPath, projectPages } = options;
  const device = resolveDevice(options);
  const childOptions = { ...options, device };

  if (!node?.nodeType) return null;
  const deviceStyleThemed = themedDeviceStyle(node, device, options);
  const cssRaw = styleToCss(
    mergeDeviceStyleWithTypeDefaults(node.nodeType, deviceStyleThemed),
    activeSiteTheme(options)
  );
  const rowMeta = node.nodeType === 'row' ? node.props?.meta || {} : {};
  const isFooterRow =
    node.nodeType === 'row' && (rowMeta.isFooter || rowMeta.role === 'footer' || rootRowTag === 'footer');
  const isHeaderRow =
    node.nodeType === 'row' && (rowMeta.isHeader || rowMeta.role === 'header' || rootRowTag === 'header');
  // Free-move can persist absolute positioning on rows; never allow for header/footer in live output.
  const css =
    isFooterRow || isHeaderRow
      ? {
          ...cssRaw,
          position: 'static',
          top: undefined,
          right: undefined,
          bottom: undefined,
          left: undefined,
          zIndex: undefined,
        }
      : cssRaw;
  const children = Array.isArray(node.children) ? node.children : [];
  const hit = builderHitAttrs(node, options);

  if (node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack') {
    const useSemantic =
      node.nodeType === 'row' &&
      typeof rootRowTag === 'string' &&
      rootRowTag !== '' &&
      rootRowTag !== 'div';
    const Container = useSemantic ? rootRowTag : 'div';
    const headerAttrs =
      node.nodeType === 'row' && (rowMeta.isHeader || rowMeta.role === 'header')
        ? {
            'data-site-header': 'true',
            ...(rowMeta.headerAlign ? { 'data-header-align': String(rowMeta.headerAlign) } : {}),
          }
        : {};
    const footerAttrs =
      node.nodeType === 'row' && (rowMeta.isFooter || rowMeta.role === 'footer' || rootRowTag === 'footer')
        ? { 'data-site-footer': 'true' }
        : {};

    return (
      <Container
        key={key}
        style={css}
        className={containerClassName(node.nodeType)}
        {...headerAttrs}
        {...footerAttrs}
        {...hit}
      >
        {children.map((child, index) =>
          renderNode(child, String(child.id ?? `${key}-${index}`), childOptions)
        )}
      </Container>
    );
  }

  if (node.nodeType === 'heading') {
    return (
      <h1 key={key} style={css} className={options.builderDataAttr ? leafClassName('', options) : undefined} {...hit}>
        {node.props?.text || ''}
      </h1>
    );
  }

  if (node.nodeType === 'text') {
    return (
      <p key={key} style={css} className={options.builderDataAttr ? leafClassName('', options) : undefined} {...hit}>
        {node.props?.text || ''}
      </p>
    );
  }

  if (node.nodeType === 'rich_text') {
    const anim = getRichTextAnimationStyle(node.props?.animation || {});
    const merged = {
      ...(css || {}),
      ...(anim.style || {}),
    };
    return (
      <div
        key={key}
        className={leafClassName(`live-rich-text ${anim.className || ''}`.trim(), options)}
        style={merged}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(node.props?.content || '<p></p>') }}
        {...hit}
      />
    );
  }

  if (node.nodeType === 'image') {
    const src = node.props?.src || '';
    if (!src) return null;
    const caption = node.props?.caption;
    const imageHeightPx = Number(node.props?.imageHeightPx || 0);
    const imgStyle = {
      objectFit: node.props?.imageFit || 'cover',
      ...(imageHeightPx > 0 ? { height: `${imageHeightPx}px` } : {}),
    };
    return (
      <figure key={key} style={css} className={options.builderDataAttr ? leafClassName('', options) : undefined} {...hit}>
        <img src={src} alt={node.props?.alt || ''} style={imgStyle} loading="lazy" />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  if (node.nodeType === 'button') {
    const href = node.props?.href;
    const content = renderButtonContent(node);
    const btnType = typeof node.props?.type === 'string' ? node.props.type : 'default';
    const btnClass = `bld-btn bld-btn--${btnType}`.trim();
    if (href && typeof href === 'string') {
      return (
        <a
          key={key}
          href={href}
          style={css}
          className={options.builderDataAttr ? `${leafClassName('', options)} ${btnClass}`.trim() : btnClass}
          {...hit}
        >
          {content}
        </a>
      );
    }
    const onAction = node.actionsJson?.onClick;
    if (onAction) {
      const btn = <ActionButton style={css} className={btnClass} label={content} action={onAction} />;
      return options.builderDataAttr ? (
        <span key={key} className={leafClassName('', options)} style={{ display: 'inline-block' }} {...hit}>
          {btn}
        </span>
      ) : (
        <ActionButton key={key} style={css} className={btnClass} label={content} action={onAction} />
      );
    }
    return (
      <button
        key={key}
        type="button"
        style={css}
        className={options.builderDataAttr ? `${leafClassName('', options)} ${btnClass}`.trim() : btnClass}
        {...hit}
      >
        {content}
      </button>
    );
  }

  if (node.nodeType === 'menu') {
    const useProjectPages = Boolean(node.props?.useProjectPages);
    const items = useProjectPages
      ? (Array.isArray(projectPages) ? projectPages : []).map((page) => ({
          label: page.title,
          to: page.href,
        }))
      : Array.isArray(node.props?.items)
        ? node.props.items
        : [];
    const orientation = node.props?.orientation === 'column' ? 'column' : 'row';
    const deviceStyle = themedDeviceStyle(node, device, options);
    const mergedForMenu = mergeDeviceStyleWithTypeDefaults(
      'menu',
      mergeMenuDeviceStyle(orientation, deviceStyle, { align: node.props?.align }, activeSiteTheme(options))
    );
    const menuCss = styleToCss(mergedForMenu, activeSiteTheme(options));
    const styleVars = menuCssVars(mergedForMenu);
    const inner = (
      <Menu
        style={{
          ...menuCss,
          ...styleVars,
        }}
        items={items}
        orientation={orientation}
        variant={node.props?.variant}
        align={node.props?.align}
        ariaLabel={node.props?.ariaLabel || 'Main navigation'}
        currentPath={currentPath || ''}
        mega={node.props?.mega || {}}
        mobile={node.props?.mobile || {}}
        sticky={node.props?.sticky || {}}
        className={options.builderDataAttr ? 'live-node bld-block' : 'live-node'}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <div key={key} style={{ width: '100%', minWidth: 0 }}>
        {inner}
      </div>
    );
  }

  if (node.nodeType === 'table') {
    const inner = (
      <DynamicTable
        style={css}
        columns={Array.isArray(node.props?.columns) ? node.props.columns : []}
        dataSource={node.dataJson?.source}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <DynamicTable
        key={key}
        style={css}
        columns={Array.isArray(node.props?.columns) ? node.props.columns : []}
        dataSource={node.dataJson?.source}
      />
    );
  }

  if (node.nodeType === 'form') {
    const inner = (
      <DynamicForm
        style={css}
        className="live-form--bound"
        fields={Array.isArray(node.props?.fields) ? node.props.fields : []}
        submitLabel={node.props?.submitLabel}
        notifications={node.props?.notifications}
        formId={String(node.id)}
        pageId={options?.pageId}
        projectId={options?.projectId}
        dataSource={node.dataJson?.source}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <DynamicForm
        key={key}
        style={css}
        className="live-form--bound"
        fields={Array.isArray(node.props?.fields) ? node.props.fields : []}
        submitLabel={node.props?.submitLabel}
        notifications={node.props?.notifications}
        formId={String(node.id)}
        pageId={options?.pageId}
        projectId={options?.projectId}
        dataSource={node.dataJson?.source}
      />
    );
  }

  if (node.nodeType === 'carousel') {
    const inner = (
      <Carousel
        style={css}
        slides={Array.isArray(node.props?.slides) ? node.props.slides : []}
        settings={node.props?.settings}
        device={device}
        variant={node.props?.variant}
        autoplay={node.props?.autoplay}
        loop={node.props?.loop}
        showArrows={node.props?.showArrows}
        showDots={node.props?.showDots}
        speed={node.props?.speed}
        interval={node.props?.interval}
        slidesPerView={node.props?.slidesPerView}
        gap={node.props?.gap}
      />
    );
    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <Carousel
        key={key}
        style={css}
        slides={Array.isArray(node.props?.slides) ? node.props.slides : []}
        settings={node.props?.settings}
        device={device}
        variant={node.props?.variant}
        autoplay={node.props?.autoplay}
        loop={node.props?.loop}
        showArrows={node.props?.showArrows}
        showDots={node.props?.showDots}
        speed={node.props?.speed}
        interval={node.props?.interval}
        slidesPerView={node.props?.slidesPerView}
        gap={node.props?.gap}
      />
    );
  }

  if (
    node.nodeType === 'input' ||
    node.nodeType === 'textarea' ||
    node.nodeType === 'select' ||
    node.nodeType === 'checkbox' ||
    node.nodeType === 'radio' ||
    node.nodeType === 'switch' ||
    node.nodeType === 'date' ||
    node.nodeType === 'submit'
  ) {
    const label = typeof node.props?.label === 'string' ? node.props.label : '';
    const name = typeof node.props?.name === 'string' ? node.props.name : '';
    const placeholder = typeof node.props?.placeholder === 'string' ? node.props.placeholder : '';
    const required = Boolean(node.props?.required);
    const type = typeof node.props?.type === 'string' ? node.props.type : node.nodeType;
    const optionsList = Array.isArray(node.props?.options) ? node.props.options : [];
    const safeOptions = optionsList
      .filter((o) => o && (typeof o === 'string' || typeof o === 'object'))
      .slice(0, 50)
      .map((o, i) => {
        if (typeof o === 'string') return { value: o, label: o, key: `${o}-${i}` };
        const v = typeof o.value === 'string' ? o.value : '';
        const l = typeof o.label === 'string' ? o.label : v;
        return { value: v, label: l, key: `${v}-${i}` };
      })
      .filter((o) => o.value || o.label);

    const inner =
      node.nodeType === 'textarea' ? (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <textarea
            className="live-form-field__control"
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
            rows={Number(node.props?.rows || 4)}
          />
        </label>
      ) : node.nodeType === 'select' ? (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <select className="live-form-field__control" name={name || undefined} required={required} defaultValue="">
            {placeholder ? <option value="">{placeholder}</option> : <option value="">Select…</option>}
            {safeOptions.map((o) => (
              <option key={o.key} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : node.nodeType === 'checkbox' || node.nodeType === 'switch' ? (
        <label className="live-form-field live-form-field--toggle" style={css}>
          <input type="checkbox" name={name || undefined} required={required} />
          <span className="live-form-field__toggleLabel">
            {label || 'Checkbox'}
            {required ? <span className="live-form-field__req"> *</span> : null}
          </span>
        </label>
      ) : node.nodeType === 'radio' ? (
        <fieldset className="live-form-field live-form-field--radio" style={css}>
          {label ? (
            <legend className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </legend>
          ) : null}
          {(safeOptions.length
            ? safeOptions
            : [
                { value: 'a', label: 'Option A', key: 'a' },
                { value: 'b', label: 'Option B', key: 'b' },
              ]
          ).map((o) => (
            <label key={o.key} className="live-form-field__radioOption">
              <input type="radio" name={name || `radio-${node.id}`} value={o.value} required={required} />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>
      ) : node.nodeType === 'submit' ? (
        <button key={key} type="submit" style={css} className={options.builderDataAttr ? leafClassName('', options) : undefined} {...hit}>
          {typeof node.props?.text === 'string' && node.props.text.trim() ? node.props.text.trim() : 'Submit'}
        </button>
      ) : (
        <label className="live-form-field" style={css}>
          {label ? (
            <span className="live-form-field__label">
              {label}
              {required ? <span className="live-form-field__req"> *</span> : null}
            </span>
          ) : null}
          <input
            className="live-form-field__control"
            type={type === 'email' ? 'email' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            name={name || undefined}
            placeholder={placeholder || undefined}
            required={required}
          />
        </label>
      );

    return options.builderDataAttr ? (
      <div key={key} className={leafClassName('', options)} style={{ width: '100%', minWidth: 0 }} {...hit}>
        {inner}
      </div>
    ) : (
      <div key={key} style={{ width: '100%', minWidth: 0 }}>
        {inner}
      </div>
    );
  }

  return null;
}

export function renderTree(nodes = [], options = {}) {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node, index) => {
    const key = String(node?.id ?? `root-${index}`);
    const semantic = rootSemanticTag(nodes, index);
    const tags = semantic ? { ...options, rootRowTag: semantic } : options;
    return renderNode(node, key, tags);
  });
}
