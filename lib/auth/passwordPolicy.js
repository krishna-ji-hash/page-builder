const WEAK_PASSWORDS = new Set(['changeme', 'password', 'admin', '123456', 'test', '12345678']);

export function validateNewPassword(newPassword, currentPassword = '') {
  const next = String(newPassword || '');
  const current = String(currentPassword || '');

  if (!next) return { ok: false, error: 'New password is required' };
  if (next.length < 8) return { ok: false, error: 'New password must be at least 8 characters' };
  if (WEAK_PASSWORDS.has(next.toLowerCase())) {
    return { ok: false, error: 'Choose a stronger password' };
  }
  if (current && next === current) {
    return { ok: false, error: 'New password must be different from current password' };
  }
  return { ok: true };
}
