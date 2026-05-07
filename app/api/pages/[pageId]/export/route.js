import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getBuilderState } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildReactExport(tree) {
  const snapshot = JSON.stringify(Array.isArray(tree) ? tree : [], null, 2);
  return `import React from 'react';

const snapshot = ${snapshot};

export default function ExportedPage() {
  return (
    <main data-exported="builder-page">
      {/* Runtime renderer should map snapshot to components */}
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </main>
  );
}
`;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderNodeHtml(node) {
  if (!node || typeof node !== 'object') return '';
  const children = Array.isArray(node.children) ? node.children.map(renderNodeHtml).join('') : '';
  if (node.nodeType === 'row' || node.nodeType === 'column' || node.nodeType === 'stack') {
    return `<div data-node-type="${escapeHtml(node.nodeType)}">${children}</div>`;
  }
  if (node.nodeType === 'heading') return `<h1>${escapeHtml(node.props?.text || '')}</h1>`;
  if (node.nodeType === 'text') return `<p>${escapeHtml(node.props?.text || '')}</p>`;
  if (node.nodeType === 'rich_text') return `<div>${String(node.props?.content || '')}</div>`;
  if (node.nodeType === 'button') return `<button type="button">${escapeHtml(node.props?.text || 'Button')}</button>`;
  if (node.nodeType === 'image') {
    const src = escapeHtml(node.props?.src || '');
    const alt = escapeHtml(node.props?.alt || '');
    return src ? `<img src="${src}" alt="${alt}" />` : '';
  }
  if (node.nodeType === 'menu') {
    const items = Array.isArray(node.props?.items) ? node.props.items : [];
    return `<nav>${items
      .map((item) => `<a href="${escapeHtml(item?.to || '#')}">${escapeHtml(item?.label || 'Item')}</a>`)
      .join('')}</nav>`;
  }
  if (node.nodeType === 'carousel') {
    const slides = Array.isArray(node.props?.slides) ? node.props.slides : [];
    return `<section class="export-carousel">${slides
      .map((slide) => `<article><h3>${escapeHtml(slide?.title || '')}</h3><p>${escapeHtml(slide?.body || '')}</p></article>`)
      .join('')}</section>`;
  }
  return '';
}

function buildHtmlExport(tree) {
  return `<main>${(Array.isArray(tree) ? tree : []).map(renderNodeHtml).join('')}</main>`;
}
}

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  const format = String(new URL(request.url).searchParams.get('format') || 'html').toLowerCase();
  if (!Number.isInteger(pageId) || pageId <= 0) {
    return fail('Invalid pageId', 400);
  }

  try {
    const data = await getBuilderState(pageId);
    if (!data) return fail('Page not found', 404);
    const tree = Array.isArray(data.tree) ? data.tree : [];
    if (format === 'react') {
      return ok({ pageId, format: 'react', code: buildReactExport(tree) });
    }
    return ok({ pageId, format: 'html', code: buildHtmlExport(tree) });
  } catch (error) {
    return fail('Failed to export page', 500, error.message);
  }
}
