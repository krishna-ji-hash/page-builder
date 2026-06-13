import { Suspense } from 'react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import '@/styles/admin/login.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Login',
  description: 'Sign in to the builder admin',
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <h1 className="admin-login__title">Admin sign in</h1>
        <p className="admin-login__subtitle">Builder platform administration</p>
        <Suspense fallback={<p className="admin-login__loading">Loading…</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
