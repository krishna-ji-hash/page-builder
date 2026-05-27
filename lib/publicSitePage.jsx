import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { getPageVarsBucket, livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { normalizeSiteTheme, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { isPublicSlug } from '@/lib/routeParams';
import { publicPagePathForSeo } from '@/lib/publicSiteUrls';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';
import JsonLd from '@/components/seo/JsonLd';
import LcpImagePreload from '@/components/seo/LcpImagePreload';
import LiveDoc from '@/components/live/LiveDoc';

function cloneGlobalNode(node, prefix) {
  return {
    ...node,
    id: `${prefix}-${node.id}`,
    parentNodeId: null,
    children: Array.isArray(node.children)
      ? node.children.map((child) => ({
          ...cloneGlobalNode(child, prefix),
          parentNodeId: `${prefix}-${node.id}`,
        }))
      : [],
  };
}

export async function buildPublicSiteMetadata(projectSlug, pageSlug) {
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    return {};
  }
  const page = await getPublishedPageForPublic(projectSlug, pageSlug);
  if (!page) return {};

  const currentPath = publicPagePathForSeo(projectSlug, pageSlug);
  const { metadata } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
  });
  return metadata;
}

export default async function PublicSitePageView({ projectSlug, pageSlug, searchParams }) {
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    return <div style={{ padding: 40 }}>Page not found</div>;
  }

  const sp = searchParams ? await Promise.resolve(searchParams) : null;
  const pageParam = typeof sp?.page === 'string' ? Number(sp.page) : 0;
  const pageContext = Number.isInteger(pageParam) && pageParam > 0 ? { cms: { page: pageParam } } : null;
  const page = await getPublishedPageForPublic(projectSlug, pageSlug, pageContext);

  if (!page) {
    return (
      <div style={{ padding: 40, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Page not published</h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          This page has no published snapshot yet. Publish it from the builder to make it live.
        </p>
      </div>
    );
  }

  if (!page.snapshot_json) {
    return (
      <div style={{ padding: 40, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Page not published</h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Published version exists but has no valid snapshot. Re-publish from the builder.
        </p>
      </div>
    );
  }

  if (!Array.isArray(page.snapshot_json) || page.snapshot_json.length === 0) {
    return <div style={{ padding: 40 }}>Published page is empty</div>;
  }

  const frozenGlobals = page.publishedGlobalSections || {};
  const globalHeader = frozenGlobals.header
    ? cloneGlobalNode(frozenGlobals.header, 'global-header')
    : null;
  const globalFooter = frozenGlobals.footer
    ? cloneGlobalNode(frozenGlobals.footer, 'global-footer')
    : null;
  const renderNodes = buildRenderNodesWithGlobals(
    page.snapshot_json,
    globalHeader,
    globalFooter,
    cloneGlobalNode
  );
  const currentPath = publicPagePathForSeo(projectSlug, pageSlug);
  const siteTheme = normalizeSiteTheme(page.projectConfig?.siteTheme);
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const pageVars = getPageVarsBucket(siteTheme, pageSlug);
  const stickyHeader = Boolean(pageVars?.stickyHeader);
  const bodyLayout = resolveBodyLayout(siteTheme, pageSlug);
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page.projectConfig,
    pageName: page.name,
    currentPath,
    pageSeo: page.seo,
  });

  const projectPages = (page.projectPages || []).map((p) => ({
    slug: p.slug,
    title: p.title,
    href: publicPagePathForSeo(projectSlug, p.slug),
  }));

  return (
    <div
      className="live-site"
      data-project-slug={projectSlug}
      data-page-slug={pageSlug}
      data-route-kind="published"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      data-live-body-layout={bodyLayout}
      style={{
        ...siteCssVars,
        ...livePageCssVarOverridesForPage(siteTheme, pageSlug),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <JsonLd data={schemaJsonLd} />
      <LcpImagePreload nodes={renderNodes} />
      <LiveDoc>
        <PublishedLiveTree
          nodes={renderNodes}
          options={{
            currentPath,
            projectPages,
            siteTheme,
            pageSlug,
            pageId: page.id,
            projectId: page.projectId,
            projectSlug,
          }}
        />
      </LiveDoc>
    </div>
  );
}
