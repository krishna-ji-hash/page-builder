'use client';

import { useEffect, useState } from 'react';
import '@/styles/admin/platform.css';
import '@/styles/admin/forms.css';

export default function AdminChangePasswordModal({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Password change failed');
        return;
      }
      setSuccess('Password updated successfully.');
      window.setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="wizard-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="wizard-panel admin-password-modal">
        <h2 id="change-password-title" style={{ margin: '0 0 4px' }}>
          Change password
        </h2>
        <p className="admin-page__description" style={{ margin: '0 0 18px' }}>
          Enter your current password, then choose a new one (minimum 8 characters).
        </p>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label htmlFor="admin-current-password">Current password</label>
            <input
              id="admin-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-new-password">New password</label>
            <input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-confirm-password">Confirm new password</label>
            <input
              id="admin-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p className="platform-alert platform-alert--error" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="platform-alert" style={{ color: '#166534', background: '#ecfdf3', border: '1px solid #bbf7d0' }}>
              {success}
            </p>
          ) : null}

          <div className="platform-actions" style={{ marginTop: 16 }}>
            <button type="button" className="platform-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="platform-btn platform-btn--primary" disabled={loading}>
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
