import { mergeBlogPostIntoDetailProps, resolveBlogDetailPageProps } from '@/lib/blogDetailPageDefaults';
import { siteBlogPostPublishedDate } from '@/lib/siteBlogPosts.js';
import {
  getBlogDetailSectionDef,
  isAnyBlogDetailWidgetNodeType,
} from '@/lib/blogDetailSectionRegistry';

function mapNodeTree(nodes, mapper) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const next = mapper(node);
    if (Array.isArray(next.children) && next.children.length) {
      return { ...next, children: mapNodeTree(next.children, mapper) };
    }
    return next;
  });
}

function injectBlogPostIntoDetailNode(node, post, blogListHref, catalogPosts) {
  if (!isAnyBlogDetailWidgetNodeType(node?.nodeType)) return node;
  if (node.nodeType === 'blog_detail_page') {
    return {
      ...node,
      props: mergeBlogPostIntoDetailProps(node.props, post, blogListHref, catalogPosts),
    };
  }
  const def = getBlogDetailSectionDef(node.nodeType);
  if (!def) return node;
  const base = resolveBlogDetailPageProps(node.props);
  if (def.sectionKey === 'hero') {
    return {
      ...node,
      props: {
        ...base,
        slug: post.slug,
        category: post.category,
        readTime: post.readTime,
        publishedDate: siteBlogPostPublishedDate(post),
        title: post.title,
        description: post.description,
        image: post.image,
        blogListHref,
      },
    };
  }
  if (def.sectionKey === 'article') {
    return {
      ...node,
      props: {
        ...base,
        content: post.content.map((block) => ({ ...block })),
      },
    };
  }
  return node;
}

/** Inject live article fields into blog detail widgets before publish render. */
export function injectBlogPostIntoPageTree(nodes, post, blogListHref = '/blog', catalogPosts = null) {
  if (!post) return nodes;
  return mapNodeTree(nodes, (node) => injectBlogPostIntoDetailNode(node, post, blogListHref, catalogPosts));
}

export function pageTreeHasBlogDetailWidget(nodes) {
  let found = false;
  mapNodeTree(nodes, (node) => {
    if (isAnyBlogDetailWidgetNodeType(node?.nodeType)) found = true;
    return node;
  });
  return found;
}

export function pageTreeHasUnifiedBlogDetailPage(nodes) {
  let found = false;
  mapNodeTree(nodes, (node) => {
    if (node?.nodeType === 'blog_detail_page') found = true;
    return node;
  });
  return found;
}
