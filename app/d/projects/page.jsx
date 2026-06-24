import { redirect } from 'next/navigation';
import { D_PROJECTS_PATH } from '@/lib/admin/dProjectRoutes';

export default function DProjectsRedirect() {
  redirect(D_PROJECTS_PATH);
}
