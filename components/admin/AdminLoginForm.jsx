'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DEV_EMAIL = 'admin@localhost';
const DEV_PASSWORD = 'changeme';

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
      const next = searchParams.get('next') || '/admin/dashboard';
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login__form" onSubmit={handleSubmit}>
      <p className="admin-login__hint">
        Local dev: <code>{DEV_EMAIL}</code> / <code>{DEV_PASSWORD}</code>
      </p>
      <label className="admin-login__field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="admin-login__field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <p className="admin-login__error" role="alert">{error}</p> : null}
      <button type="submit" className="admin-login__submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
