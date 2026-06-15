import AdminLoginExperience from '@/components/admin/AdminLoginExperience';
import '@/styles/admin/login.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Login · Dispatch',
  description: 'Sign in to the Dispatch admin dashboard',
};

export default function AdminLoginPage() {
  return <AdminLoginExperience />;
}
