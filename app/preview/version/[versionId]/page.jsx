import { notFound } from 'next/navigation';
import VersionPreviewView from '@/components/live/VersionPreviewView';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Version preview',
  robots: { index: false, follow: false },
};

export default async function VersionPreviewPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const versionId = Number(resolved.versionId);
  if (!Number.isInteger(versionId) || versionId <= 0) {
    notFound();
  }
  return <VersionPreviewView versionId={versionId} />;
}
