import Link from 'next/link';
import { dBuilderPagePath } from '@/lib/admin/dBuilderRoutes';
import '@/styles/admin/d-draft-preview.css';

type DraftPreviewBarProps = {
  pageId: number;
};

export default function DraftPreviewBar({ pageId }: DraftPreviewBarProps) {
  return (
    <header className="d-draft-preview__bar" role="banner">
      <span className="d-draft-preview__label">Draft Preview — Not Published</span>
      <Link href={dBuilderPagePath(pageId)} className="d-draft-preview__back">
        Back to Builder
      </Link>
    </header>
  );
}
