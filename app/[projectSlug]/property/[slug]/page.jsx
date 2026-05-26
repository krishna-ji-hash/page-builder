import { notFound } from 'next/navigation';
import { getPublishedPage } from '@/services/site/publishedPageService';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { getItemBySlug } from '@/services/builder/cmsService';
import { applyBindingsToTree, applyBindingsToString } from '@/lib/cms/cmsBindings';
import { getPageVarsBucket, livePageCssVarOverrides, resolveBodyLayout, resolveContentMaxWidthPx } from '@/lib/livePageCssVars';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';
import JsonLd from '@/components/seo/JsonLd';
import LiveDoc from '@/components/live/LiveDoc';
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

  const currentPath = `/${projectSlug}/property/${slug}`;
  const { metadata } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'properties' } },
  });
  return metadata;
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
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'properties' } },
  });

  const boundNodes = applyBindingsToTree(page.snapshot_json, {
    item,
    sys: { slug, collection: 'properties' },
  });

  const propertyTemplateSlug = 'property-detail';
  const propertyPageVars = getPageVarsBucket(siteTheme, propertyTemplateSlug);
  const propertySectionGapPx =
    propertyPageVars && Number.isFinite(Number(propertyPageVars.sectionGapPx))
      ? Number(propertyPageVars.sectionGapPx)
      : null;
  const propertySectionPadBottomPx =
    propertyPageVars && Number.isFinite(Number(propertyPageVars.sectionPadBottomPx))
      ? Number(propertyPageVars.sectionPadBottomPx)
      : null;
  const propertyContentMaxWidthPx = resolveContentMaxWidthPx(propertyPageVars);
  const propertyBodyLayout = resolveBodyLayout(siteTheme, propertyTemplateSlug);

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug="property-detail"
      data-route-kind="cms-property"
      data-live-body-layout={propertyBodyLayout}
      style={{
        ...siteCssVars,
        ...livePageCssVarOverrides({
          sectionGapPx: propertySectionGapPx,
          sectionPadBottomPx: propertySectionPadBottomPx,
          contentMaxWidthPx: propertyContentMaxWidthPx,
        }),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <JsonLd data={schemaJsonLd} />
      <LiveDoc>
        <PublishedLiveTree
          nodes={boundNodes}
          options={{
            currentPath,
            projectPages: page.projectPages || [],
            siteTheme,
            pageSlug: propertyTemplateSlug,
            pageId: page.id,
            projectId: page.projectId,
            projectSlug,
          }}
        />
      </LiveDoc>
    </div>
  );
}

