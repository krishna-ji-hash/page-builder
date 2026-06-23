import { redirect } from 'next/navigation';
import AdminLoginExperience from '@/components/admin/AdminLoginExperience';
import { resolveAdminLoginRedirectTarget } from '@/lib/admin/adminRoutes';
import { isAuthDisabled } from '@/lib/auth/publicPaths';
import { resolveSessionFromCookies } from '@/lib/auth/session';
import '@/styles/admin/login.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Login · Dispatch',
  description: 'Sign in to the Dispatch admin dashboard',
};

export default async function AdminLoginPage({ searchParams }) {
  if (!isAuthDisabled()) {
    const session = await resolveSessionFromCookies();
    if (session) {
      const params = await searchParams;
      redirect(resolveAdminLoginRedirectTarget(params?.next));
    }
  }

  return <AdminLoginExperience />;
}
