import { notFound } from 'next/navigation';
import { RuntimeProvider } from '@/components/runtime/RuntimeProvider';
import { getPublishedPage } from '@/services/site/publishedPageService';
import { renderTree } from '@/lib/liveRenderer';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { getItemBySlug } from '@/services/builder/cmsService';
import { applyBindingsToTree } from '@/lib/cms/cmsBindings';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';
import JsonLd from '@/components/seo/JsonLd';
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

  const page = await getPublishedPage(projectSlug, 'product-detail');
  if (!page) return {};
  const item = await getItemBySlug(page.projectId, 'products', slug, { status: 'published' });
  if (!item) return {};

  const currentPath = `/${projectSlug}/product/${slug}`;
  const { metadata } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'products' } },
  });
  return metadata;
}

export default async function ProductDetailRoute({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  const slug = String(resolved.slug || '');
  if (!isPublicSlug(projectSlug) || !isPublicSlug(slug)) notFound();

  const page = await getPublishedPage(projectSlug, 'product-detail');
  if (!page?.snapshot_json) notFound();

  const item = await getItemBySlug(page.projectId, 'products', slug, { status: 'published' });
  if (!item) notFound();

  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const currentPath = `/${projectSlug}/product/${slug}`;
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'products' } },
  });

  const boundNodes = applyBindingsToTree(page.snapshot_json, {
    item,
    sys: { slug, collection: 'products' },
  });

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug="product-detail"
      data-route-kind="cms-product"
      style={{
        ...siteCssVars,
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <JsonLd data={schemaJsonLd} />
      <div className="live-doc">
        <RuntimeProvider>
          {renderTree(boundNodes, {
            currentPath,
            projectPages: page.projectPages || [],
            siteTheme,
            pageId: page.id,
            projectId: page.projectId,
            projectSlug,
          })}
        </RuntimeProvider>
      </div>
    </div>
  );
}
