import { notFound } from 'next/navigation';
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { normalizeThemeTokens, themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { getItemBySlug } from '@/services/builder/cmsService';
import { applyBindingsToTree } from '@/lib/cms/cmsBindings';
import { livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';
import JsonLd from '@/components/seo/JsonLd';
import LiveDoc from '@/components/live/LiveDoc';
import { normalizeProductFromCmsItem, resolveProductPricing, resolveProductStock, computeReviewStats, buildProductSchemaJsonLd, buildBreadcrumbSchemaJsonLd } from '@/lib/runtime/productRuntime';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import '@/styles/shared/pdp.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  const slug = String(resolved.slug || '');
  if (!isPublicSlug(projectSlug) || !isPublicSlug(slug)) return {};

  const page = await getPublishedPageForPublic(projectSlug, 'product-detail');
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

  const page = await getPublishedPageForPublic(projectSlug, 'product-detail');
  if (!page?.snapshot_json) notFound();

  const item = await getItemBySlug(page.projectId, 'products', slug, { status: 'published' });
  if (!item) notFound();

  const product = normalizeProductFromCmsItem(item);
  // Provide project id for client runtime store keying (not persisted to CMS).
  product._projectId = page.projectId;

  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const themeTokens = normalizeThemeTokens(page.projectConfig?.themeTokens);
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);
  const currentPath = `/${projectSlug}/product/${slug}`;
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'products' } },
  });

  const pricing = resolveProductPricing(product, null);
  const stock = resolveProductStock(product, null);
  const productSchema = buildProductSchemaJsonLd({
    product,
    pricing,
    stock,
    reviewStats: computeReviewStats([]),
    canonical: undefined,
    projectSlug,
  });
  const breadcrumbSchema = buildBreadcrumbSchemaJsonLd({
    projectSlug,
    product,
    categoryLabel: product.category || '',
  });

  const boundNodes = applyBindingsToTree(page.snapshot_json, {
    item,
    sys: { slug, collection: 'products' },
  });

  const productTemplateSlug = 'product-detail';
  const productBodyLayout = resolveBodyLayout(siteTheme, productTemplateSlug);

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug="product-detail"
      data-route-kind="cms-product"
      data-live-body-layout={productBodyLayout}
      style={{
        ...siteCssVars,
        ...tokenVars,
        ...livePageCssVarOverridesForPage(siteTheme, productTemplateSlug),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <JsonLd data={[schemaJsonLd, productSchema, breadcrumbSchema].filter(Boolean)} />
      <LiveDoc>
        <PublishedLiveTree
          nodes={boundNodes}
          options={{
            currentPath,
            projectPages: page.projectPages || [],
            siteTheme,
            pageSlug: productTemplateSlug,
            pageId: page.id,
            projectId: page.projectId,
            projectSlug,
            pdp: {
              runtimeKey: `pdp:${page.projectId}:${slug}`,
              projectId: page.projectId,
              projectSlug,
              slug,
              product,
            },
          }}
        />
      </LiveDoc>
    </div>
  );
}
