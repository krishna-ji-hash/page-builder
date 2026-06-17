import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectForms from '@/components/admin/workspace/AdminProjectForms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Forms',
};

export default async function ProjectFormsPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'forms');
  return <AdminProjectForms projectId={projectId} />;
}
