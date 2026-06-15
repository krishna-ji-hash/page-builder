'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

const INTRO_MS = 4500;

function buildParticles(count, seedOffset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const n = i + seedOffset;
    const top = 8 + ((n * 37) % 84);
    const delay = (n % 12) * 0.08;
    const duration = 1.6 + (n % 5) * 0.22;
    const size = 2 + (n % 4);
    return { id: n, top: `${top}%`, delay: `${delay}s`, duration: `${duration}s`, size };
  });
}

function AdminLoginIntro({ visible }) {
  const stars = useMemo(() => buildParticles(26, 0), []);
  const fires = useMemo(() => buildParticles(26, 100), []);

  if (!visible) return null;

  return (
    <div className="intro-layer" aria-hidden="true">
      <div className="intro-layer__glow intro-layer__glow--blue" />
      <div className="intro-layer__glow intro-layer__glow--orange" />

      <div className="intro-layer__particles intro-layer__particles--left">
        {stars.map((p) => (
          <span
            key={`star-${p.id}`}
            className="particle particle--star"
            style={{
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      <div className="intro-layer__particles intro-layer__particles--right">
        {fires.map((p) => (
          <span
            key={`fire-${p.id}`}
            className="particle particle--fire"
            style={{
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size + 1,
              height: p.size + 2,
            }}
          />
        ))}
      </div>

      <div className="portal">
        <div className="portal__ring portal__ring--outer" />
        <div className="portal__ring portal__ring--mid" />
        <div className="portal__ring portal__ring--inner" />
        <span className="spark-line spark-line--h" />
        <span className="spark-line spark-line--v" />
        <span className="portal__core" />
      </div>

      <div className="brand-reveal">
        <p className="brand-reveal__eyebrow">Dispatch Solutions</p>
        <h2 className="brand-reveal__title">DISPATCH</h2>
        <p className="brand-reveal__tagline">Smart Logistics Portal</p>
      </div>
    </div>
  );
}

export default function AdminLoginExperience() {
  const [introActive, setIntroActive] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setIntroActive(false);
      setReady(true);
      return undefined;
    }

    const revealTimer = window.setTimeout(() => setReady(true), INTRO_MS);
    const hideTimer = window.setTimeout(() => setIntroActive(false), INTRO_MS + 700);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <main
      className={`auth-page admin-login${ready ? ' auth-page--ready' : ''}${introActive ? ' auth-page--intro-active' : ''}`}
      aria-labelledby="admin-login-title"
    >
      <div className="auth-page__backdrop" aria-hidden="true">
        <div className="auth-page__grid" />
        <div className="auth-page__vignette" />
      </div>

      <AdminLoginIntro visible={introActive} />

      <div className="auth-page__panel">
        <div className="logo-badge" aria-hidden="true">
          <span className="logo-badge__mark">D</span>
        </div>

        <div className="login-card">
          <header className="login-card__header">
            <h1 id="admin-login-title" className="login-card__title">
              Welcome Back
            </h1>
            <p className="login-card__subtitle">
              Login to manage shipments, courier allocation, tracking, NDR, billing, and dispatch
              operations.
            </p>
          </header>
          <Suspense fallback={<p className="login-card__loading">Loading…</p>}>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="auth-page__footer">Secure admin access · Dispatch Solutions</p>
      </div>
    </main>
  );
}
