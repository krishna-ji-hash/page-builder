import { redirect } from 'next/navigation';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';

export default function AdminIndexPage() {
  redirect(ADMIN_PROJECTS_PATH);
}
