'use client';

import { useMemo, useState } from 'react';
import { normalizeMapEmbedUrl } from '@/lib/mapEmbedUrl';

function normalizeEmbedUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';
  if (/youtube\.com\/watch\?v=/.test(url)) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (/youtu\.be\//.test(url)) {
    const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}

function socialGlyph(icon) {
  const k = String(icon || '').toLowerCase();
  if (k === 'in' || k === 'linkedin') return 'in';
  if (k === 'x' || k === 'twitter') return '𝕏';
  if (k === 'ig' || k === 'instagram') return '◎';
  if (k === 'fb' || k === 'facebook') return 'f';
  if (k === 'yt' || k === 'youtube') return '▶';
  return '•';
}

export function LiveIcon({ symbol, ariaLabel, className = '' }) {
  return (
    <span className={`bld-el bld-el-icon ${className}`.trim()} role="img" aria-label={ariaLabel || 'Icon'}>
      {symbol || '★'}
    </span>
  );
}

export function LiveIconBox({ symbol, title, text, align = 'center', className = '' }) {
  const alignClass = align === 'left' ? 'bld-el-icon-box--left' : align === 'right' ? 'bld-el-icon-box--right' : '';
  return (
    <div className={`bld-el bld-el-icon-box ${alignClass} ${className}`.trim()}>
      <span className="bld-el-icon-box__glyph" aria-hidden>
        {symbol || '★'}
      </span>
      {title ? <h3 className="bld-el-icon-box__title">{title}</h3> : null}
      {text ? <p className="bld-el-icon-box__text">{text}</p> : null}
    </div>
  );
}

export function LiveContentCard({
  title,
  body,
  imageSrc,
  imageAlt,
  buttonText,
  buttonHref,
  showImage = true,
  showButton = true,
  className = '',
  style,
}) {
  return (
    <article className={`bld-el bld-el-card ${className}`.trim()} style={style}>
      {showImage && imageSrc ? (
        <div className="bld-el-card__media">
          <img src={imageSrc} alt={imageAlt || title || 'Card'} loading="lazy" />
        </div>
      ) : null}
      <div className="bld-el-card__body">
        {title ? <h3 className="bld-el-card__title">{title}</h3> : null}
        {body ? <p className="bld-el-card__text">{body}</p> : null}
        {showButton && buttonText ? (
          <a className="bld-el-card__btn" href={buttonHref || '#'}>
            {buttonText}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function LiveSpacer({ heightPx = 48, className = '' }) {
  const h = Math.max(4, Math.min(400, Number(heightPx) || 48));
  return <div className={`bld-el bld-el-spacer ${className}`.trim()} style={{ height: `${h}px` }} aria-hidden />;
}

export function LiveModal({
  triggerLabel,
  title,
  body,
  previewOpen = false,
  builderMode = false,
  showTitle = true,
  showClose = true,
  closeOnBackdrop = true,
  dialogStyle,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(Boolean(previewOpen));
  const isOpen = builderMode ? Boolean(previewOpen) : open;
  const hasNestedContent = children != null;
  const showLegacyBody = Boolean(body) && !hasNestedContent;
  const titleId = 'bld-el-modal-title';

  return (
    <div className={`bld-el bld-el-modal ${builderMode ? 'bld-el-modal--builder' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="bld-el-modal__trigger"
        onClick={() => !builderMode && setOpen(true)}
        disabled={builderMode}
      >
        {triggerLabel || 'Open'}
      </button>
      {isOpen ? (
        <div
          className="bld-el-modal__backdrop"
          role="presentation"
          onClick={() => {
            if (builderMode) return;
            if (closeOnBackdrop) setOpen(false);
          }}
        >
          <div
            className="bld-el-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={showTitle && title ? titleId : undefined}
            style={dialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {showClose ? (
              <button
                type="button"
                className="bld-el-modal__close"
                aria-label="Close"
                onClick={() => !builderMode && setOpen(false)}
              >
                ×
              </button>
            ) : null}
            {showTitle && title ? (
              <h3 id={titleId} className="bld-el-modal__title">
                {title}
              </h3>
            ) : null}
            {hasNestedContent ? (
              <div className="bld-el-modal__content">{children}</div>
            ) : showLegacyBody ? (
              <p className="bld-el-modal__body">{body}</p>
            ) : (
              <p className="bld-el-modal__body bld-el-modal__body--empty">
                Add elements to <strong>Modal content</strong> in the Layers panel.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LiveVideoEmbed({ embedUrl, title, aspectRatio = '16 / 9', className = '' }) {
  const src = useMemo(() => normalizeEmbedUrl(embedUrl), [embedUrl]);
  return (
    <div className={`bld-el bld-el-video ${className}`.trim()} style={{ aspectRatio: aspectRatio || '16 / 9' }}>
      {src ? (
        <iframe
          src={src}
          title={title || 'Video'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="bld-el-video__placeholder">
          <span className="bld-el-video__play" aria-hidden>
            ▶
          </span>
          <span>Add a YouTube or embed URL in the inspector</span>
        </div>
      )}
    </div>
  );
}

export function LiveMapEmbed({ embedUrl, address, heightPx = 320, className = '' }) {
  const h = Math.max(160, Math.min(600, Number(heightPx) || 320));
  const src = useMemo(() => normalizeMapEmbedUrl(embedUrl), [embedUrl]);
  return (
    <div
      className={`bld-el bld-el-map ${className}`.trim()}
      style={{ minHeight: `${h}px`, height: `${h}px` }}
    >
      {src ? (
        <iframe src={src} title={address || 'Map'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="bld-el-map__placeholder">
          <span className="bld-el-map__pin" aria-hidden>
            ⌖
          </span>
          <p>{address || 'Add a Google Maps embed URL in the inspector'}</p>
        </div>
      )}
    </div>
  );
}

export function LiveSocialIcons({ links = [], sizePx = 40, gapPx = 12, variant = 'filled', className = '' }) {
  const list = Array.isArray(links) ? links.filter((l) => l && (l.href || l.label)) : [];
  const size = Math.max(28, Math.min(64, Number(sizePx) || 40));
  const gap = Math.max(4, Math.min(32, Number(gapPx) || 12));
  return (
    <div
      className={`bld-el bld-el-social bld-el-social--${variant === 'outline' ? 'outline' : 'filled'} ${className}`.trim()}
      style={{ gap: `${gap}px` }}
    >
      {list.map((link, i) => (
        <a
          key={String(link.id || link.href || i)}
          href={link.href || '#'}
          className="bld-el-social__link"
          style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.38)}px` }}
          aria-label={link.label || 'Social link'}
          target="_blank"
          rel="noopener noreferrer"
        >
          {socialGlyph(link.icon)}
        </a>
      ))}
    </div>
  );
}

export {
  LiveAlertNotice,
  LiveBadgeLabel,
  LiveCodeBlock,
  LiveContainerBox,
  LiveCountdownTimer,
  LiveCounterBlock,
  LiveFeatureList,
  LiveGridBlock,
  LiveHtmlBlock,
  LiveLogoBlock,
  LiveLottieAnimation,
  LiveNewsletterForm,
  LivePricingCard,
  LiveProgressBar,
  LiveRatingStars,
  LiveTablePro,
  LiveTestimonialCard,
  LiveWhatsappButton,
} from './AdvancedElementBatch2';
