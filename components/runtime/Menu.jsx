'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { menuNavClassName } from '@/lib/menuNav';
import { isActiveMenuTo, normalizeMenuItems } from '@/lib/menuItems';

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [locked]);
}

function focusFirst(rootEl) {
  if (!rootEl) return;
  const el = rootEl.querySelector(
    'button:not([disabled]), a[href]:not([aria-disabled="true"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (el && typeof el.focus === 'function') el.focus();
}

function trapTab(e, rootEl) {
  if (e.key !== 'Tab' || !rootEl) return;
  const focusables = Array.from(
    rootEl.querySelectorAll(
      'button:not([disabled]), a[href]:not([aria-disabled="true"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !rootEl.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function Chevron({ open }) {
  return (
    <span className={`menu__chev ${open ? 'is-open' : ''}`.trim()} aria-hidden="true">
      ▾
    </span>
  );
}

function MenuLink({ item, currentPath, depth, onNavigate, className }) {
  const active = isActiveMenuTo(item.to, currentPath);
  const rel = item.target === '_blank' ? 'noopener noreferrer' : undefined;
  return (
    <a
      href={item.to || '#'}
      target={item.target || undefined}
      rel={rel}
      className={['menu-item', className || '', active ? 'is-active' : '', depth > 1 ? 'menu-item--sub' : '']
        .filter(Boolean)
        .join(' ')}
      aria-current={active ? 'page' : undefined}
      onClick={(e) => {
        if (!item.to || item.to === '#') e.preventDefault();
        onNavigate?.();
      }}
    >
      {item.icon ? <span className="menu-item__icon" aria-hidden="true">{item.icon}</span> : null}
      <span className="menu-item__label">{item.label}</span>
      {item.description && depth > 1 ? <span className="menu-item__desc">{item.description}</span> : null}
    </a>
  );
}

function DesktopDropdown({ item, currentPath, onNavigate, preferMega }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const isMega = Boolean(preferMega && item.mega?.enabled);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (btnRef.current && btnRef.current.contains(t)) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div
      className={`menu-dd ${isMega ? 'menu-dd--mega' : ''}`.trim()}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className="menu-item menu-item--trigger"
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'ArrowDown') setOpen(true);
        }}
      >
        {item.icon ? <span className="menu-item__icon" aria-hidden="true">{item.icon}</span> : null}
        <span className="menu-item__label">{item.label}</span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="menu-dd__panel"
          role="menu"
          aria-label={`${item.label} submenu`}
          style={
            isMega
              ? {
                  ['--mega-cols']: String(clamp(item.mega?.columns || 2, 1, 6)),
                }
              : undefined
          }
        >
          <div className={`menu-dd__grid ${isMega ? 'menu-dd__grid--mega' : ''}`.trim()}>
            <div className="menu-dd__items">
              {(item.children || []).map((c) => (
                <MenuLink
                  key={c.id}
                  item={c}
                  currentPath={currentPath}
                  depth={2}
                  onNavigate={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="menu-item--sub"
                />
              ))}
            </div>
            {isMega && item.mega?.featured?.label ? (
              <div className="menu-dd__featured" role="note">
                <div className="menu-dd__featuredTitle">{item.mega.featured.label}</div>
                {item.mega.featured.description ? (
                  <div className="menu-dd__featuredDesc">{item.mega.featured.description}</div>
                ) : null}
                {item.mega.featured.to ? (
                  <a
                    className="menu-dd__featuredCta"
                    href={item.mega.featured.to}
                    onClick={(e) => {
                      if (item.mega.featured.to === '#') e.preventDefault();
                      setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    Learn more
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileDrawer({ open, onClose, items, currentPath, title }) {
  const rootRef = useRef(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      trapTab(e, rootRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => focusFirst(rootRef.current), 0);
    return () => clearTimeout(t);
  }, [open]);

  const [expanded, setExpanded] = useState(() => ({}));
  useEffect(() => {
    if (!open) setExpanded({});
  }, [open]);

  const renderNode = (node, depth) => {
    const hasKids = Array.isArray(node.children) && node.children.length > 0;
    const isOpen = Boolean(expanded[node.id]);
    return (
      <div key={node.id} className={`menu-m__row menu-m__row--d${depth}`.trim()}>
        <div className="menu-m__rowHead">
          <MenuLink
            item={node}
            currentPath={currentPath}
            depth={depth}
            onNavigate={() => onClose?.()}
            className="menu-m__link"
          />
          {hasKids ? (
            <button
              type="button"
              className="menu-m__expand"
              aria-expanded={isOpen ? 'true' : 'false'}
              aria-controls={`menu-m-kids-${node.id}`}
              onClick={() => setExpanded((p) => ({ ...p, [node.id]: !p[node.id] }))}
            >
              <Chevron open={isOpen} />
            </button>
          ) : null}
        </div>
        {hasKids ? (
          <div id={`menu-m-kids-${node.id}`} className={`menu-m__kids ${isOpen ? 'is-open' : ''}`.trim()}>
            {node.children.map((c) => renderNode(c, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`menu-m ${open ? 'is-open' : ''}`.trim()} aria-hidden={open ? 'false' : 'true'}>
      <div className="menu-m__backdrop" onMouseDown={() => onClose?.()} />
      <aside ref={rootRef} className="menu-m__drawer" role="dialog" aria-modal="true" aria-label={title || 'Menu'}>
        <div className="menu-m__top">
          <div className="menu-m__title">{title || 'Menu'}</div>
          <button type="button" className="menu-m__close" onClick={() => onClose?.()} aria-label="Close menu">
            ✕
          </button>
        </div>
        <div className="menu-m__list">{items.map((it) => renderNode(it, 1))}</div>
      </aside>
    </div>
  );
}

export default function Menu({
  items,
  orientation = 'row',
  variant,
  align,
  ariaLabel,
  currentPath,
  mobile = {},
  mega = {},
  sticky = {},
  style,
  className,
}) {
  const { items: safeItems } = useMemo(() => normalizeMenuItems(items), [items]);
  const navClass = menuNavClassName({ orientation, variant, align, extraClass: className || '' });

  const [mobileOpen, setMobileOpen] = useState(false);
  const showMobile = mobile?.enabled !== false; // enabled by default
  const hamburgerLabel = typeof mobile?.hamburgerLabel === 'string' ? mobile.hamburgerLabel : 'Open menu';
  const title = typeof mobile?.title === 'string' ? mobile.title : '';
  const preferMega = Boolean(mega?.enabled);

  // Optional hide/reveal + scroll shadow (only adds classes; sticky positioning is still controlled by header row)
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const hideOnScroll = Boolean(sticky?.hideOnScroll);
  const shadowOnScroll = sticky?.shadowOnScroll !== false;
  useEffect(() => {
    if (!hideOnScroll && !shadowOnScroll) return;
    let lastY = window.scrollY || 0;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        if (shadowOnScroll) setScrolled(y > 8);
        if (hideOnScroll) {
          const goingDown = y > lastY + 6;
          const goingUp = y < lastY - 6;
          if (goingDown && y > 80) setHidden(true);
          if (goingUp) setHidden(false);
        }
        lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hideOnScroll, shadowOnScroll]);

  return (
    <nav
      className={[
        navClass,
        'menu-adv',
        showMobile ? 'menu-adv--mobile' : '',
        scrolled ? 'menu-adv--scrolled' : '',
        hidden ? 'menu-adv--hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim()}
      style={style}
      aria-label={ariaLabel || 'Main navigation'}
    >
      {showMobile ? (
        <button
          type="button"
          className="menu__hamburger"
          aria-label={hamburgerLabel}
          aria-expanded={mobileOpen ? 'true' : 'false'}
          onClick={() => setMobileOpen(true)}
        >
          <span className="menu__hamburger-lines" aria-hidden />
        </button>
      ) : null}

      <div className="menu__desktop" aria-hidden={showMobile ? 'true' : 'false'}>
        {safeItems.map((it) =>
          it.children && it.children.length ? (
            <DesktopDropdown
              key={it.id}
              item={it}
              currentPath={currentPath || ''}
              preferMega={preferMega}
              onNavigate={() => {}}
            />
          ) : (
            <MenuLink key={it.id} item={it} currentPath={currentPath || ''} depth={1} />
          )
        )}
      </div>

      {showMobile ? (
        <MobileDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          items={safeItems}
          currentPath={currentPath || ''}
          title={title}
        />
      ) : null}
    </nav>
  );
}

