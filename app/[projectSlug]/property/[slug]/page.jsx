import { notFound } from 'next/navigation';
import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { getPublishedPage } from '@/services/site/publishedPageService';
import { renderTree } from '@/lib/liveRenderer';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { getItemBySlug } from '@/services/builder/cmsService';
import { applyBindingsToTree, applyBindingsToString } from '@/lib/cms/cmsBindings';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  const slug = String(resolved.slug || '');
  if (!isPublicSlug(projectSlug) || !isPublicSlug(slug)) return {};

  const page = await getPublishedPage(projectSlug, 'property-detail');
  if (!page) return {};
  const item = await getItemBySlug(page.projectId, 'properties', slug, { status: 'published' });
  if (!item) return {};

  const ctx = { item, sys: { slug, collection: 'properties' } };
  const titleT = page?.seo?.titleTemplate || '{{item.title}}';
  const descT = page?.seo?.descriptionTemplate || '{{item.data.description}}';
  const ogTitleT = page?.seo?.ogTitleTemplate || titleT;
  const ogImageT = page?.seo?.ogImageTemplate || '{{item.data.ogImage}}';

  const title = applyBindingsToString(String(titleT || ''), ctx) || item.title || item.slug;
  const description = applyBindingsToString(String(descT || ''), ctx) || '';
  const ogTitle = applyBindingsToString(String(ogTitleT || ''), ctx) || title;
  const ogImage = applyBindingsToString(String(ogImageT || ''), ctx) || '';
  const canonical = `/${projectSlug}/property/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
      url: canonical,
    },
  };
}

export default async function PropertyRoute({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  const slug = String(resolved.slug || '');
  if (!isPublicSlug(projectSlug) || !isPublicSlug(slug)) notFound();

  // Convention: project should have a published "property-detail" page used as the template.
  const page = await getPublishedPage(projectSlug, 'property-detail');
  if (!page?.snapshot_json) notFound();

  const item = await getItemBySlug(page.projectId, 'properties', slug, { status: 'published' });
  if (!item) notFound();

  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const currentPath = `/${projectSlug}/property/${slug}`;

  const boundNodes = applyBindingsToTree(page.snapshot_json, {
    item,
    sys: { slug, collection: 'properties' },
  });

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug="property-detail"
      data-route-kind="cms-property"
      style={{
        ...siteCssVars,
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <div className="live-doc">
        <RuntimeProvider>
          {renderTree(boundNodes, {
            currentPath,
            projectPages: page.projectPages || [],
            siteTheme,
            pageId: page.id,
            projectId: page.projectId,
          })}
        </RuntimeProvider>
      </div>
    </div>
  );
}

