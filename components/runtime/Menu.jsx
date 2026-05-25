'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { menuNavClassName } from '@/lib/menuNav';
import { isActiveMenuTo, normalizeMenuItems } from '@/lib/menuItems';
import {
  menuDrawerStyleVars,
  menuHamburgerAlignToJustify,
  normalizeMenuDrawerActionsLayout,
  normalizeMenuHamburgerAlign,
  resolveMenuMobileBreakpointPx,
} from '@/lib/menuMobile';

/** Viewport + builder artboard width — CSS media queries alone miss narrow canvas on wide monitors. */
function useMobileNavActive(enabled, breakpointPx) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setActive(false);
      return undefined;
    }

    const bp = Math.max(320, Math.min(1200, Number(breakpointPx) || 768));
    const mq = window.matchMedia(`(max-width: ${bp}px)`);

    const sync = () => {
      let next = mq.matches;
      const page =
        document.querySelector('.bld-canvas--mobile .bld-canvas__page') ||
        document.querySelector('.bld-canvas--tablet .bld-canvas__page');
      if (!next && page?.closest('.bld-canvas--mobile, .bld-canvas--tablet')) {
        next = true;
      } else if (!next && page) {
        const w = page.getBoundingClientRect().width;
        if (w > 0 && w <= bp) next = true;
      }
      setActive(next);
    };

    sync();
    mq.addEventListener('change', sync);

    const page =
      document.querySelector('.bld-canvas--mobile .bld-canvas__page') ||
      document.querySelector('.bld-canvas--tablet .bld-canvas__page');
    let ro;
    if (page && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      ro.observe(page);
    }

    return () => {
      mq.removeEventListener('change', sync);
      ro?.disconnect();
    };
  }, [enabled, breakpointPx]);

  return active;
}

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

function findHeaderActionsStack() {
  if (typeof document === 'undefined') return null;
  const header =
    document.querySelector('.live-doc > [data-site-header="true"]') ||
    document.querySelector('.live-doc > header.live-node.bld-row');
  if (!header) return null;
  return header.querySelector(
    ':scope > .live-node.bld-column > .live-node.bld-stack:has(> button), :scope > .live-node.bld-column > .live-node.bld-stack:has(.live-action-button-wrap)'
  );
}

function MobileDrawer({
  open,
  onClose,
  items,
  currentPath,
  title,
  showHeaderActions = false,
  drawerActionsLayout = 'row',
  drawerStyle,
}) {
  const rootRef = useRef(null);
  const actionsHostRef = useRef(null);
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

  useEffect(() => {
    const host = actionsHostRef.current;
    if (!host) return undefined;
    host.innerHTML = '';
    if (!open || !showHeaderActions) return undefined;

    const stack = findHeaderActionsStack();
    if (!stack) return undefined;

    const nodes = stack.querySelectorAll(
      ':scope > button, :scope > a[href], :scope > .live-action-button-wrap'
    );
    nodes.forEach((node) => {
      const cell = document.createElement('div');
      cell.className = 'menu-m__action-cell';
      const clone = node.cloneNode(true);
      const closeOnActivate = () => onClose?.();
      clone.addEventListener('click', closeOnActivate);
      cell.appendChild(clone);
      host.appendChild(cell);
    });

    return () => {
      host.innerHTML = '';
    };
  }, [open, showHeaderActions, onClose]);

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
    <div
      className={`menu-m ${open ? 'is-open' : ''}`.trim()}
      aria-hidden={open ? 'false' : 'true'}
      data-drawer-actions-layout={drawerActionsLayout}
      style={drawerStyle}
    >
      <div className="menu-m__backdrop" onMouseDown={() => onClose?.()} />
      <aside ref={rootRef} className="menu-m__drawer" role="dialog" aria-modal="true" aria-label={title || 'Menu'}>
        <div className="menu-m__top">
          <div className="menu-m__title">{title || 'Menu'}</div>
          <button type="button" className="menu-m__close" onClick={() => onClose?.()} aria-label="Close menu">
            <span className="menu-m__close-icon" aria-hidden />
          </button>
        </div>
        <div className="menu-m__list">{items.map((it) => renderNode(it, 1))}</div>
        <div ref={actionsHostRef} className="menu-m__actions" aria-label="Header actions" />
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
  const breakpointPx = resolveMenuMobileBreakpointPx(mobile);
  const hamburgerAlign = normalizeMenuHamburgerAlign(mobile?.hamburgerAlign, 'right');
  const drawerActionsLayout = normalizeMenuDrawerActionsLayout(mobile?.drawerActionsLayout, 'row');
  const showDrawerActions = mobile?.showDrawerActions !== false;
  const drawerStyle = useMemo(() => menuDrawerStyleVars(mobile), [mobile?.drawerDensity]);
  const mobileNavActive = useMobileNavActive(showMobile, breakpointPx);
  const navRef = useRef(null);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  const navStyle = useMemo(() => {
    if (!showMobile) return style;
    return {
      ...(style || {}),
      '--menu-hamburger-justify': menuHamburgerAlignToJustify(hamburgerAlign),
      '--menu-mobile-breakpoint': `${breakpointPx}px`,
    };
  }, [style, showMobile, hamburgerAlign, breakpointPx]);

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
      ref={navRef}
      className={[
        navClass,
        'menu-adv',
        showMobile ? 'menu-adv--mobile' : '',
        showMobile && mobileNavActive ? 'menu-adv--show-hamburger' : '',
        mobileOpen ? 'menu-adv--drawer-open' : '',
        scrolled ? 'menu-adv--scrolled' : '',
        hidden ? 'menu-adv--hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim()}
      style={navStyle}
      data-mobile-nav={showMobile ? 'true' : undefined}
      data-hamburger-align={showMobile ? hamburgerAlign : undefined}
      aria-label={ariaLabel || 'Main navigation'}
    >
      {showMobile ? (
        <button
          type="button"
          className="menu__hamburger"
          aria-label={mobileOpen ? 'Close menu' : hamburgerLabel}
          aria-expanded={mobileOpen ? 'true' : 'false'}
          onClick={() => setMobileOpen((open) => !open)}
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

      {showMobile && portalReady && typeof document !== 'undefined'
        ? createPortal(
            <MobileDrawer
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              items={safeItems}
              currentPath={currentPath || ''}
              title={title}
              showHeaderActions={mobileNavActive && showDrawerActions}
              drawerActionsLayout={drawerActionsLayout}
              drawerStyle={drawerStyle}
            />,
            document.body
          )
        : null}
    </nav>
  );
}

