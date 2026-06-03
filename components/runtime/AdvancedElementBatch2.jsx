'use client';

import { useEffect, useMemo, useState } from 'react';
import HeaderBrandLogo from '@/components/runtime/HeaderBrandLogo';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function alertIcon(variant) {
  if (variant === 'success') return '✓';
  if (variant === 'warning') return '⚠';
  if (variant === 'error') return '✕';
  return 'i';
}

function whatsappHref(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  const q = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${q}`;
}

function parseTargetMs(iso) {
  const t = Date.parse(String(iso || ''));
  return Number.isFinite(t) ? t : Date.now() + 7 * 86400000;
}

function diffParts(targetMs) {
  const now = Date.now();
  let s = Math.max(0, Math.floor((targetMs - now) / 1000));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  const seconds = s - minutes * 60;
  return { days, hours, minutes, seconds };
}

export function LiveContainerBox({ title, body, align = 'left', className = '' }) {
  const alignClass = align === 'center' ? 'bld-el-box--center' : align === 'right' ? 'bld-el-box--right' : '';
  return (
    <div className={`bld-el bld-el-box ${alignClass} ${className}`.trim()}>
      {title ? <h3 className="bld-el-box__title">{title}</h3> : null}
      {body ? <p className="bld-el-box__text">{body}</p> : null}
    </div>
  );
}

export function LiveGridBlock({ columns = 3, gapPx = 16, mobileStack = true, items = [], className = '' }) {
  const cols = clamp(Number(columns) || 3, 1, 6);
  const gap = clamp(Number(gapPx) || 16, 0, 48);
  const list = Array.isArray(items) ? items : [];
  return (
    <div
      className={`bld-el bld-el-grid ${mobileStack ? 'bld-el-grid--mobile-stack' : ''} ${className}`.trim()}
      style={{ '--bld-grid-cols': cols, '--bld-grid-gap': `${gap}px` }}
    >
      {list.map((item, i) => (
        <div key={String(item.id || i)} className="bld-el-grid__cell">
          {item.title ? <h4 className="bld-el-grid__title">{item.title}</h4> : null}
          {item.text ? <p className="bld-el-grid__text">{item.text}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function LiveAlertNotice({ variant = 'info', title, message, showClose = true, className = '' }) {
  const v = ['info', 'success', 'warning', 'error'].includes(variant) ? variant : 'info';
  return (
    <div className={`bld-el bld-el-alert bld-el-alert--${v} ${className}`.trim()} role="status">
      <span className="bld-el-alert__icon" aria-hidden>
        {alertIcon(v)}
      </span>
      <div className="bld-el-alert__copy">
        {title ? <p className="bld-el-alert__title">{title}</p> : null}
        {message ? <p className="bld-el-alert__message">{message}</p> : null}
      </div>
      {showClose ? (
        <span className="bld-el-alert__close" aria-hidden>
          ×
        </span>
      ) : null}
    </div>
  );
}

export function LiveBadgeLabel({ text, variant = 'primary', size = 'md', href = '', className = '' }) {
  const inner = <span className={`bld-el-badge bld-el-badge--${variant} bld-el-badge--${size}`}>{text || 'Badge'}</span>;
  if (href) {
    return (
      <a className={`bld-el bld-el-badge-wrap ${className}`.trim()} href={href}>
        {inner}
      </a>
    );
  }
  return <div className={`bld-el bld-el-badge-wrap ${className}`.trim()}>{inner}</div>;
}

export function LiveCounterBlock({ value, prefix, suffix, label, description, className = '' }) {
  return (
    <div className={`bld-el bld-el-counter ${className}`.trim()}>
      <p className="bld-el-counter__value">
        {prefix ? <span className="bld-el-counter__affix">{prefix}</span> : null}
        {value || '0'}
        {suffix ? <span className="bld-el-counter__affix">{suffix}</span> : null}
      </p>
      {label ? <p className="bld-el-counter__label">{label}</p> : null}
      {description ? <p className="bld-el-counter__desc">{description}</p> : null}
    </div>
  );
}

export function LiveProgressBar({ label, percentage = 0, helperText, className = '' }) {
  const pct = clamp(Number(percentage) || 0, 0, 100);
  return (
    <div className={`bld-el bld-el-progress ${className}`.trim()}>
      {label ? (
        <div className="bld-el-progress__head">
          <span className="bld-el-progress__label">{label}</span>
          <span className="bld-el-progress__pct">{pct}%</span>
        </div>
      ) : null}
      <div className="bld-el-progress__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="bld-el-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      {helperText ? <p className="bld-el-progress__helper">{helperText}</p> : null}
    </div>
  );
}

export function LiveRatingStars({ rating = 5, maxStars = 5, reviewText, className = '' }) {
  const max = clamp(Number(maxStars) || 5, 1, 10);
  const r = clamp(Number(rating) || 0, 0, max);
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  return (
    <div className={`bld-el bld-el-rating ${className}`.trim()}>
      <div className="bld-el-rating__stars" aria-label={`${r} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i < full || (i === full && half);
          return (
            <span key={i} className={filled ? 'bld-el-rating__star is-on' : 'bld-el-rating__star'} aria-hidden>
              ★
            </span>
          );
        })}
      </div>
      {reviewText ? <span className="bld-el-rating__text">{reviewText}</span> : null}
    </div>
  );
}

export function LiveTestimonialCard({ name, role, message, avatarSrc, rating = 5, className = '', style }) {
  const stars = clamp(Number(rating) || 0, 0, 5);
  return (
    <blockquote className={`bld-el bld-el-testimonial ${className}`.trim()} style={style}>
      <div className="bld-el-rating__stars bld-el-testimonial__stars" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < stars ? 'bld-el-rating__star is-on' : 'bld-el-rating__star'}>
            ★
          </span>
        ))}
      </div>
      {message ? <p className="bld-el-testimonial__message">{message}</p> : null}
      <footer className="bld-el-testimonial__footer">
        {avatarSrc ? (
          <img className="bld-el-testimonial__avatar" src={avatarSrc} alt={name || ''} loading="lazy" />
        ) : null}
        <div>
          {name ? <cite className="bld-el-testimonial__name">{name}</cite> : null}
          {role ? <span className="bld-el-testimonial__role">{role}</span> : null}
        </div>
      </footer>
    </blockquote>
  );
}

export function LivePricingCard({
  planName,
  price,
  period,
  description,
  features,
  ctaText,
  ctaHref,
  popular = false,
  className = '',
}) {
  const lines = String(features || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <article
      className={`bld-el bld-el-pricing-card ${popular ? 'bld-el-pricing-card--popular' : ''} ${className}`.trim()}
      style={style}
    >
      {popular ? <span className="bld-el-pricing-card__badge">Popular</span> : null}
      {planName ? <h3 className="bld-el-pricing-card__plan">{planName}</h3> : null}
      <p className="bld-el-pricing-card__price">
        <span>{price || '$0'}</span>
        {period ? <small>{period}</small> : null}
      </p>
      {description ? <p className="bld-el-pricing-card__desc">{description}</p> : null}
      {lines.length ? (
        <ul className="bld-el-pricing-card__features">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {ctaText ? (
        <a className="bld-el-pricing-card__cta" href={ctaHref || '#'}>
          {ctaText}
        </a>
      ) : null}
    </article>
  );
}

export function LiveNewsletterForm({ heading, text, emailPlaceholder, buttonText, className = '' }) {
  return (
    <div className={`bld-el bld-el-newsletter ${className}`.trim()}>
      {heading ? <h3 className="bld-el-newsletter__heading">{heading}</h3> : null}
      {text ? <p className="bld-el-newsletter__text">{text}</p> : null}
      <div className="bld-el-newsletter__row">
        <input type="email" className="bld-el-newsletter__input" placeholder={emailPlaceholder || 'Email'} readOnly aria-label="Email" />
        <button type="button" className="bld-el-newsletter__btn">
          {buttonText || 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

export function LiveWhatsappButton({ phone, message, buttonText, floating = false, className = '' }) {
  const href = whatsappHref(phone, message);
  const cls = `bld-el bld-el-whatsapp ${floating ? 'bld-el-whatsapp--float' : ''} ${className}`.trim();
  return (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      <span className="bld-el-whatsapp__icon" aria-hidden>
        WA
      </span>
      {buttonText || 'WhatsApp'}
    </a>
  );
}

export function LiveCountdownTimer({ targetIso, label, className = '' }) {
  const targetMs = useMemo(() => parseTargetMs(targetIso), [targetIso]);
  const [parts, setParts] = useState(() => diffParts(targetMs));
  useEffect(() => {
    setParts(diffParts(targetMs));
    const id = setInterval(() => setParts(diffParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  const cells = [
    { k: 'days', l: 'Days', v: parts.days },
    { k: 'hours', l: 'Hours', v: parts.hours },
    { k: 'minutes', l: 'Min', v: parts.minutes },
    { k: 'seconds', l: 'Sec', v: parts.seconds },
  ];
  return (
    <div className={`bld-el bld-el-countdown ${className}`.trim()}>
      {label ? <p className="bld-el-countdown__label">{label}</p> : null}
      <div className="bld-el-countdown__grid">
        {cells.map((c) => (
          <div key={c.k} className="bld-el-countdown__cell">
            <span className="bld-el-countdown__value">{String(c.v).padStart(2, '0')}</span>
            <span className="bld-el-countdown__unit">{c.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveHtmlBlock({ html, className = '' }) {
  const safe = sanitizeRichHtml(html || '');
  return (
    <div
      className={`bld-el bld-el-html ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe || '<p></p>' }}
    />
  );
}

export function LiveCodeBlock({ language, code, className = '' }) {
  return (
    <div className={`bld-el bld-el-code ${className}`.trim()}>
      {language ? <div className="bld-el-code__lang">{language}</div> : null}
      <pre className="bld-el-code__pre">
        <code>{code || ''}</code>
      </pre>
    </div>
  );
}

export function LiveLottieAnimation({ jsonUrl, widthPx = 240, heightPx = 240, alt = 'Animation', className = '' }) {
  const w = clamp(Number(widthPx) || 240, 80, 640);
  const h = clamp(Number(heightPx) || 240, 80, 640);
  const url = String(jsonUrl || '').trim();
  return (
    <div className={`bld-el bld-el-lottie ${className}`.trim()} style={{ width: w, height: h }}>
      {url ? (
        <div className="bld-el-lottie__placeholder">
          <span className="bld-el-lottie__glyph" aria-hidden>
            ◌
          </span>
          <p>{alt || 'Lottie URL set'}</p>
          <p className="bld-el-lottie__hint">Animation preview requires Lottie runtime (placeholder shown).</p>
        </div>
      ) : (
        <div className="bld-el-lottie__placeholder">
          <span className="bld-el-lottie__glyph" aria-hidden>
            ◌
          </span>
          <p>Add a Lottie JSON URL in the inspector</p>
        </div>
      )}
    </div>
  );
}

export function LiveLogoBlock({
  src,
  alt,
  href,
  widthPx = 160,
  className = '',
  props: logoProps,
  activeTone,
  siteTheme,
  themeTokens,
  sectionTone,
  builderTree,
  nodeId,
  device,
}) {
  const mergedProps =
    logoProps && typeof logoProps === 'object'
      ? { ...logoProps, src: logoProps.src || src, alt: logoProps.alt || alt, href: logoProps.href || href, widthPx }
      : { src, alt, href, widthPx };
  const rendered = (
    <HeaderBrandLogo
      props={mergedProps}
      className={`bld-el bld-el-logo ${className}`.trim()}
      href={href}
      widthPx={clamp(Number(widthPx) || 160, 48, 400)}
      activeTone={activeTone}
      siteTheme={siteTheme}
      themeTokens={themeTokens}
      sectionTone={sectionTone}
      builderTree={builderTree}
      nodeId={nodeId}
      device={device}
    />
  );
  if (rendered) return rendered;
  const w = clamp(Number(widthPx) || 160, 48, 400);
  const img = (
    <img src="/builder-placeholder.svg" alt={alt || 'Logo'} style={{ width: w, height: 'auto' }} loading="lazy" />
  );
  if (href) {
    return (
      <a className={`bld-el bld-el-logo ${className}`.trim()} href={href}>
        {img}
      </a>
    );
  }
  return <div className={`bld-el bld-el-logo ${className}`.trim()}>{img}</div>;
}

export function LiveFeatureList({ direction = 'vertical', items = [], className = '' }) {
  const list = Array.isArray(items) ? items : [];
  const dirClass = direction === 'horizontal' ? 'bld-el-features--horizontal' : '';
  return (
    <ul className={`bld-el bld-el-features ${dirClass} ${className}`.trim()}>
      {list.map((item, i) => (
        <li key={String(item.id || i)} className="bld-el-features__item">
          {item.icon ? <span className="bld-el-features__icon" aria-hidden>{item.icon}</span> : null}
          <div>
            {item.title ? <strong className="bld-el-features__title">{item.title}</strong> : null}
            {item.text ? <span className="bld-el-features__text">{item.text}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LiveTablePro({ headers = [], rows = [], highlightColumn = 0, className = '' }) {
  const hdrs = Array.isArray(headers) ? headers : [];
  const body = Array.isArray(rows) ? rows : [];
  const hi = Number(highlightColumn) || 0;
  return (
    <div className={`bld-el bld-el-table-pro ${className}`.trim()}>
      <table>
        <thead>
          <tr>
            {hdrs.map((h, i) => (
              <th key={`h-${i}`} className={i + 1 === hi ? 'is-highlight' : ''}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={`r-${ri}`}>
              {(Array.isArray(row) ? row : []).map((cell, ci) => (
                <td key={`c-${ri}-${ci}`} className={ci + 1 === hi ? 'is-highlight' : ''}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
