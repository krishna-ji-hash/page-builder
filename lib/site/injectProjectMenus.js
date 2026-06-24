import { isFooterRowNode, isHeaderRowNode } from '@/lib/rowLayoutMeta.js';
import { isSiteHeaderRowForCompact } from '@/lib/headerCompactLayout.js';
import { normalizeMenuItems } from '@/lib/menuItems.js';

/**
 * Inject WordPress-style project menus into existing menu nodes (layout unchanged).
 * Header/footer context is detected from row metadata; explicit props.menuLocation wins.
 *
 * @param {object[]} nodes
 * @param {{ HEADER?: object[]; FOOTER?: object[] } | null | undefined} projectMenus
 */
export function injectProjectMenusIntoNodes(nodes, projectMenus) {
  if (!Array.isArray(nodes) || !projectMenus) return nodes;

  const headerItems = Array.isArray(projectMenus.HEADER) ? projectMenus.HEADER : null;
  const footerItems = Array.isArray(projectMenus.FOOTER) ? projectMenus.FOOTER : null;
  if (!headerItems?.length && !footerItems?.length) return nodes;

  const walk = (list, ctx) =>
    (Array.isArray(list) ? list : []).map((node) => {
      if (!node || typeof node !== 'object') return node;

      const siteHeaderRow = node.nodeType === 'row' && (isHeaderRowNode(node) || isSiteHeaderRowForCompact(node));
      const siteFooterRow = node.nodeType === 'row' && isFooterRowNode(node);
      const nextCtx = {
        insideHeader: ctx.insideHeader || siteHeaderRow,
        insideFooter: ctx.insideFooter || siteFooterRow,
      };

      let nextNode = node;
      if (node.nodeType === 'menu') {
        const explicit = String(node.props?.menuLocation || '').toUpperCase();
        const location =
          explicit === 'HEADER' || explicit === 'FOOTER'
            ? explicit
            : nextCtx.insideFooter
              ? 'FOOTER'
              : nextCtx.insideHeader
                ? 'HEADER'
                : null;
        const source = location === 'HEADER' ? headerItems : location === 'FOOTER' ? footerItems : null;
        if (source?.length) {
          nextNode = {
            ...node,
            props: {
              ...(node.props || {}),
              useProjectPages: false,
              items: normalizeMenuItems(source),
            },
          };
        }
      }

      if (!Array.isArray(nextNode.children) || !nextNode.children.length) {
        return nextNode;
      }

      return {
        ...nextNode,
        children: walk(nextNode.children, nextCtx),
      };
    });

  return walk(nodes, { insideHeader: false, insideFooter: false });
}
