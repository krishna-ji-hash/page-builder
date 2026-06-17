import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectDomains from '@/components/admin/workspace/AdminProjectDomains';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Domains',
  description: 'Custom domain mapping, DNS verification, and SSL status',
};

export default async function ProjectDomainsPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'domains');
  return <AdminProjectDomains projectId={projectId} />;
}
