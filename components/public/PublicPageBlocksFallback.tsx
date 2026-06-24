import PublicPageSectionsFallback from '@/components/public/PublicPageSectionsFallback';
import { normalizePublishedBlocks } from '@/lib/site/publishedContentFormat';

type PublicPageBlocksFallbackProps = {
  content: unknown;
  project?: Record<string, unknown> | null;
  page?: Record<string, unknown> | null;
};

/** Fallback renderer for `content.blocks` and legacy array roots. */
export default function PublicPageBlocksFallback({ content, project, page }: PublicPageBlocksFallbackProps) {
  const blocks = normalizePublishedBlocks(content);
  return (
    <PublicPageSectionsFallback
      sections={blocks}
      project={project}
      page={page}
      variant="blocks"
    />
  );
}
