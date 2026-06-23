import { requireAdminPageSession } from '@/lib/auth/requireAdminPageSession';

export const dynamic = 'force-dynamic';

export default async function AdminBuilderLayout({ children }) {
  await requireAdminPageSession();
  return children;
}
