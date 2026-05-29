import { notFound } from 'next/navigation';
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import {
  alignThemeTokensWithSiteTheme,
  normalizeThemeTokens,
  themeTokensToCssVariableStyle,
} from '@/lib/themeTokens';
import { resolveMaybeAsyncParams, isPublicSlug } from '@/lib/routeParams';
import { getItemBySlug } from '@/services/builder/cmsService';
import { applyBindingsToTree, applyBindingsToString } from '@/lib/cms/cmsBindings';
import { livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
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

  const page = await getPublishedPageForPublic(projectSlug, 'blog-post');
  if (!page) return {};
  const item = await getItemBySlug(page.projectId, 'blog', slug, { status: 'published' });
  if (!item) return {};

  const currentPath = `/${projectSlug}/blog/${slug}`;
  const { metadata } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'blog' } },
  });
  return metadata;
}

export default async function BlogPostRoute({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectSlug = String(resolved.projectSlug || '');
  const slug = String(resolved.slug || '');
  if (!isPublicSlug(projectSlug) || !isPublicSlug(slug)) notFound();

  // Convention: project should have a published "blog-post" page used as the template.
  const page = await getPublishedPageForPublic(projectSlug, 'blog-post');
  if (!page?.snapshot_json) notFound();

  const item = await getItemBySlug(page.projectId, 'blog', slug, { status: 'published' });
  if (!item) notFound();

  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const themeTokens = alignThemeTokensWithSiteTheme(
    siteTheme,
    normalizeThemeTokens(page.projectConfig?.themeTokens)
  );
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);
  const currentPath = `/${projectSlug}/blog/${slug}`;
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
    cmsContext: { item, sys: { slug, collection: 'blog' } },
  });

  // Bind `{{item.*}}` and `{{sys.*}}` into the page snapshot (single pass).
  const boundNodes = applyBindingsToTree(page.snapshot_json, {
    item,
    sys: { slug, collection: 'blog' },
  });

  const blogTemplateSlug = 'blog-post';
  const blogBodyLayout = resolveBodyLayout(siteTheme, blogTemplateSlug);

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug="blog-post"
      data-route-kind="cms-blog"
      data-live-body-layout={blogBodyLayout}
      style={{
        ...siteCssVars,
        ...tokenVars,
        ...livePageCssVarOverridesForPage(siteTheme, blogTemplateSlug),
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
            pageSlug: blogTemplateSlug,
            pageId: page.id,
            projectId: page.projectId,
            projectSlug,
          }}
        />
      </LiveDoc>
    </div>
  );
}

