import { notFound } from 'next/navigation';
import DraftPreviewBar from '@/components/admin/d/DraftPreviewBar';
import DraftPreviewHostView from '@/lib/site/draftPreviewHostView';
import { requireAdminPageAccess } from '@/lib/auth/guardAdminPage';
import { AdminPageValidationError } from '@/lib/admin/adminPageInput';
import { getAdminPage } from '@/services/admin/adminPagesService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function DPreviewPage({ params }: PageProps) {
  const { pageId } = await params;
  const pid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) {
    notFound();
  }

  let data;
  try {
    data = await getAdminPage(String(pid));
  } catch (error) {
    if (error instanceof AdminPageValidationError) {
      notFound();
    }
    throw error;
  }

  await requireAdminPageAccess({
    projectId: data.page.projectId,
    action: 'read',
    nextPath: `/d/preview/${pid}`,
  });

  return (
    <div className="d-draft-preview">
      <DraftPreviewBar pageId={pid} />
      <div className="d-draft-preview__content">
        <DraftPreviewHostView
          pageId={pid}
          draftJson={data.page.draftJson}
          project={data.project}
          page={data.page}
        />
      </div>
    </div>
  );
}
