import { redirect } from 'next/navigation';
import { ADMIN_PROJECTS_PATH } from '@/lib/admin/adminRoutes';

export const dynamic = 'force-dynamic';

/** Builder index — flow enters builder from a project page, not a separate manager hop. */
export default function AdminBuilderIndexPage() {
  redirect(ADMIN_PROJECTS_PATH);
}
