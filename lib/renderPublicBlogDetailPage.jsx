import { notFound } from 'next/navigation';
import '@/styles/live/live-site.css';
import '@/styles/shared/menu.css';
import '@/styles/shared/button.css';
import PublishedLiveTree from '@/components/live/PublishedLiveTree';
import { getPublishedPageForPublic } from '@/services/site/publishedPageService';
import { getPageVarsBucket, livePageCssVarOverridesForPage, resolveBodyLayout } from '@/lib/livePageCssVars';
import { DEFAULT_SITE_THEME, siteThemeToCssVariableStyle } from '@/lib/siteDesignTheme';
import { themeTokensToCssVariableStyle } from '@/lib/themeTokens';
import {
  buildPublishedLiveRenderOptions,
  prepareNodesForLiveRender,
} from '@/lib/prepareLivePageRender';
import { buildRenderNodesWithGlobals } from '@/lib/globalSectionMerge';
import { applyHomeHeaderNavToGlobal, syncPageTreeHeaderNavFromHome } from '@/lib/globalHeaderNavSync';
import { getPublishedHomeHeaderRow } from '@/services/site/homeHeaderNavService';
import { getPublicProjectMenus } from '@/services/admin/adminMenusService';
import { injectProjectMenusIntoNodes } from '@/lib/site/injectProjectMenus.js';
import { publicPagePathForSeo, getPublicProjectSlug } from '@/lib/publicSiteUrls';
import { resolveSeoMetadata } from '@/lib/seo/seoEngine';
import JsonLd from '@/components/seo/JsonLd';
import LcpImagePreload from '@/components/seo/LcpImagePreload';
import LiveDoc from '@/components/live/LiveDoc';
import { resolveSiteBlogPost } from '@/lib/siteBlogPosts';
import { siteBlogPostToDetailProps } from '@/lib/blogDetailPageDefaults';
import { buildBlogDetailPageBodyNodes } from '@/lib/blogDetailPageTemplates';
import {
  loadBlogPostCatalog,
  resolveBlogPostForDetail,
} from '@/lib/publishedBlogPosts';
import {
  injectBlogPostIntoPageTree,
  pageTreeHasBlogDetailWidget,
  pageTreeHasUnifiedBlogDetailPage,
} from '@/lib/injectBlogPostIntoPageTree';

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

async function resolveBlogDetailThemePage(projectSlug) {
  const blogPost = await getPublishedPageForPublic(projectSlug, 'blog-post');
  if (blogPost?.projectConfig) return blogPost;
  const blog = await getPublishedPageForPublic(projectSlug, 'blog');
  if (blog?.projectConfig) return blog;
  return getPublishedPageForPublic(projectSlug, 'home');
}

async function buildBlogDetailGlobals(projectSlug, page) {
  const homeHeader = await getPublishedHomeHeaderRow(projectSlug);
  const frozenGlobals = page?.publishedGlobalSections || {};
  const syncedGlobalHeaderSource =
    frozenGlobals.header && homeHeader
      ? applyHomeHeaderNavToGlobal(frozenGlobals.header, homeHeader)
      : frozenGlobals.header;
  const globalHeader = syncedGlobalHeaderSource
    ? cloneGlobalNode(syncedGlobalHeaderSource, 'global-header')
    : null;
  const globalFooter = frozenGlobals.footer
    ? cloneGlobalNode(frozenGlobals.footer, 'global-footer')
    : null;
  return { homeHeader, globalHeader, globalFooter };
}

async function buildBlogDetailRenderContext({
  projectSlug,
  blogListHref,
  post,
  page,
  pageNodes,
}) {
  const projectMenus = page?.projectId
    ? await getPublicProjectMenus(BigInt(page.projectId), projectSlug)
    : null;
  const nodesWithMenus = injectProjectMenusIntoNodes(pageNodes, projectMenus);
  const { nodes: renderNodes, siteTheme, themeTokens } = prepareNodesForLiveRender(
    nodesWithMenus,
    page?.projectConfig
  );
  const currentPath = `${blogListHref}/${post.slug}`;
  const projectPages = (page?.projectPages || []).map((p) => ({
    slug: p.slug,
    title: p.title,
    href: publicPagePathForSeo(projectSlug, p.slug),
  }));
  const renderOptions = buildPublishedLiveRenderOptions(page?.projectConfig, {
    currentPath,
    projectPages,
    pageSlug: 'blog-post',
    pageId: page?.id,
    projectId: page?.projectId,
    projectSlug,
    builderTree: renderNodes,
  });
  const pageVars = getPageVarsBucket(siteTheme, 'blog-post');
  const postSeo = post?.seo && typeof post.seo === 'object' ? post.seo : {};
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: page?.projectConfig,
    pageName: postSeo.title || post.title || page?.name,
    currentPath,
    pageSeo: {
      ...(page?.seo && typeof page.seo === 'object' ? page.seo : {}),
      title: postSeo.title || post.title,
      description: postSeo.description || post.description,
      ogTitle: postSeo.ogTitle || postSeo.title || post.title,
      ogDescription: postSeo.ogDescription || postSeo.description || post.description,
      ogImage: postSeo.ogImage || post.image || '',
      keywords: Array.isArray(postSeo.keywords) ? postSeo.keywords : [],
      noindex: Boolean(postSeo.noindex),
      nofollow: Boolean(postSeo.nofollow),
      canonicalUrl: postSeo.canonicalUrl || undefined,
      schemaType: postSeo.engineSchemaType || undefined,
      schemaJsonLd: postSeo.engineSchemaJsonLd ?? null,
    },
    cmsContext: {
      item: {
        title: post.title,
        publishedAt: post.publishedDate || undefined,
        updatedAt: undefined,
      },
    },
  });

  return {
    renderNodes,
    renderOptions,
    schemaJsonLd,
    siteTheme,
    themeTokens,
    stickyHeader: Boolean(pageVars?.stickyHeader),
    bodyLayout: resolveBodyLayout(siteTheme, 'blog-post'),
  };
}

function BlogDetailLiveShell({ projectSlug, context }) {
  const { renderNodes, renderOptions, schemaJsonLd, siteTheme, themeTokens, stickyHeader, bodyLayout } =
    context;
  const siteCssVars = siteThemeToCssVariableStyle(siteTheme);
  const tokenVars = themeTokensToCssVariableStyle(themeTokens);

  return (
    <div
      className="live-site"
      data-site-preset={siteTheme.presetId || 'light'}
      data-token-mode={themeTokens.mode === 'dark' ? 'dark' : 'light'}
      data-project-slug={projectSlug}
      data-page-slug="blog-post"
      data-route-kind="blog-detail"
      data-sticky-header={stickyHeader ? 'true' : 'false'}
      data-live-body-layout={bodyLayout}
      style={{
        ...siteCssVars,
        ...tokenVars,
        ...livePageCssVarOverridesForPage(siteTheme, 'blog-post'),
        fontFamily: siteTheme.typography.fontFamily,
      }}
    >
      <JsonLd data={schemaJsonLd} />
      <LcpImagePreload nodes={renderNodes} />
      <LiveDoc>
        <PublishedLiveTree nodes={renderNodes} options={renderOptions} />
      </LiveDoc>
    </div>
  );
}

function buildBlogDetailPageNodes(detailProps, globalHeader, globalFooter) {
  const bodyNodes = buildBlogDetailPageBodyNodes(detailProps);
  return buildRenderNodesWithGlobals(bodyNodes, globalHeader, globalFooter, cloneGlobalNode);
}

export async function buildBlogDetailMetadata({ slug, projectSlug = getPublicProjectSlug() }) {
  const post = await resolveBlogPostForDetail(slug, projectSlug);
  if (!post) return { title: 'Blog not found' };
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.description;
  return {
    title: `${title} | Dispatch Solutions Blog`,
    description,
    ...(post.seo?.robots === 'noindex' ? { robots: { index: false, follow: true } } : {}),
    ...(post.seo?.canonicalUrl ? { alternates: { canonical: post.seo.canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      ...(post.seo?.ogImage || post.image ? { images: [post.seo?.ogImage || post.image] } : {}),
    },
  };
}

/**
 * Render /blog/[slug] and /{project}/blog/[slug] with builder template when published.
 */
export async function renderPublicBlogDetailPage({
  slug,
  projectSlug = getPublicProjectSlug(),
  blogListHref = '/blog',
}) {
  const post = await resolveBlogPostForDetail(slug, projectSlug);
  if (!post) notFound();

  const catalog = await loadBlogPostCatalog(projectSlug);
  const detailProps = {
    ...siteBlogPostToDetailProps(post, blogListHref),
    catalogPosts: catalog,
  };
  const page = await getPublishedPageForPublic(projectSlug, 'blog-post');
  const hasTemplate =
    page?.snapshot_json &&
    Array.isArray(page.snapshot_json) &&
    page.snapshot_json.length > 0 &&
    pageTreeHasBlogDetailWidget(page.snapshot_json);
  const hasUnifiedWidget = hasTemplate && pageTreeHasUnifiedBlogDetailPage(page.snapshot_json);

  if (!hasTemplate) {
    const themePage = (await resolveBlogDetailThemePage(projectSlug)) || {
      projectConfig: { siteTheme: DEFAULT_SITE_THEME },
      name: post.title,
    };
    const { globalHeader, globalFooter } = await buildBlogDetailGlobals(projectSlug, themePage);
    const pageNodes = buildBlogDetailPageNodes(detailProps, globalHeader, globalFooter);
    const context = await buildBlogDetailRenderContext({
      projectSlug,
      blogListHref,
      post,
      page: themePage,
      pageNodes,
    });

    return <BlogDetailLiveShell projectSlug={projectSlug} context={context} />;
  }

  const { homeHeader, globalHeader, globalFooter } = await buildBlogDetailGlobals(projectSlug, page);

  if (!hasUnifiedWidget) {
    const pageNodes = buildBlogDetailPageNodes(detailProps, globalHeader, globalFooter);
    const context = await buildBlogDetailRenderContext({
      projectSlug,
      blogListHref,
      post,
      page,
      pageNodes,
    });

    return <BlogDetailLiveShell projectSlug={projectSlug} context={context} />;
  }

  const injected = injectBlogPostIntoPageTree(page.snapshot_json, post, blogListHref, catalog);
  const pageNodes = syncPageTreeHeaderNavFromHome(injected, homeHeader, 'blog-post');
  const mergedNodes = buildRenderNodesWithGlobals(
    pageNodes,
    globalHeader,
    globalFooter,
    cloneGlobalNode
  );
  const context = await buildBlogDetailRenderContext({
    projectSlug,
    blogListHref,
    post,
    page,
    pageNodes: mergedNodes,
  });

  return <BlogDetailLiveShell projectSlug={projectSlug} context={context} />;
}
