'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DEV_EMAIL = 'admin@localhost';
const DEV_PASSWORD = 'changeme';
const IS_DEV = process.env.NODE_ENV === 'development';

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Login failed');
        return;
      }
      const next = searchParams.get('next') || '/admin/projects';
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-card__form" onSubmit={handleSubmit}>
      {IS_DEV ? (
        <p className="login-card__hint">
          Local dev credentials: <code>{DEV_EMAIL}</code> / <code>{DEV_PASSWORD}</code>
        </p>
      ) : null}
      <label className="login-card__field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="login-card__field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? (
        <p className="login-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? 'Signing in…' : 'LOGIN TO ADMIN'}
      </button>
    </form>
  );
}
