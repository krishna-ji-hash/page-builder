import { redirect } from 'next/navigation';
import { D_PROJECT_NEW_PATH } from '@/lib/admin/dProjectRoutes';

export default function DProjectNewRedirect() {
  redirect(D_PROJECT_NEW_PATH);
}
