import { redirect } from 'next/navigation';
import { D_PROJECTS_PATH } from '@/lib/admin/dProjectRoutes';

export default function DIndexPage() {
  redirect(D_PROJECTS_PATH);
}
