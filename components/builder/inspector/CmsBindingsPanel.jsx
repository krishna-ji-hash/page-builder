'use client';

import { useEffect, useMemo, useState } from 'react';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function cmsMeta(node) {
  const meta = node?.props?.meta;
  const m = isPlainObject(meta) ? meta : {};
  return isPlainObject(m.cms) ? m.cms : {};
}

function cmsBindings(node) {
  const cms = cmsMeta(node);
  return isPlainObject(cms.bindings) ? cms.bindings : {};
}

function cmsRepeat(node) {
  const cms = cmsMeta(node);
  return isPlainObject(cms.repeat) ? cms.repeat : null;
}

function bindingExpr(path) {
  const p = String(path || '').trim();
  return p ? `{{${p}}}` : '';
}

function fieldOptionsFromSchema(schema) {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const opts = [
    { id: '', label: '— No binding —', path: '' },
    { id: 'item.title', label: 'Title', path: 'item.title' },
    { id: 'item.slug', label: 'Slug', path: 'item.slug' },
    { id: 'sys.slug', label: 'System: slug', path: 'sys.slug' },
    { id: 'sys.index', label: 'System: index', path: 'sys.index' },
  ];
  for (const f of fields) {
    const id = typeof f?.id === 'string' ? f.id.trim() : '';
    const label = typeof f?.label === 'string' ? f.label.trim() : id;
    if (!id) continue;
    opts.push({ id: `item.data.${id}`, label: `${label} (${id})`, path: `item.data.${id}` });
  }
  return opts;
}

function queryPresetOptions() {
  return [
    { id: '', label: 'Custom' },
    { id: 'latest', label: 'Latest items' },
    { id: 'featured', label: 'Featured items' },
    { id: 'by_category', label: 'By category' },
    { id: 'by_tag', label: 'By tag' },
    { id: 'random', label: 'Random' },
  ];
}

export default function CmsBindingsPanel({ selectedNode, projectId, onChange }) {
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState('');
  const cms = useMemo(() => cmsMeta(selectedNode), [selectedNode]);
  const repeat = useMemo(() => cmsRepeat(selectedNode), [selectedNode]);
  const bindings = useMemo(() => cmsBindings(selectedNode), [selectedNode]);

  const canUseCms = Number.isInteger(Number(projectId)) && Number(projectId) > 0;

  const contextCollectionSlug =
    typeof cms?.contextCollectionSlug === 'string' && cms.contextCollectionSlug.trim()
      ? cms.contextCollectionSlug.trim()
      : typeof repeat?.collectionSlug === 'string'
        ? repeat.collectionSlug
        : '';

  useEffect(() => {
    if (!canUseCms) return;
    let mounted = true;
    setError('');
    fetchJson(`/api/projects/${projectId}/cms/collections`)
      .then((data) => {
        if (!mounted) return;
        setCollections(Array.isArray(data.collections) ? data.collections : []);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to load collections');
      });
    return () => {
      mounted = false;
    };
  }, [projectId, canUseCms]);

  const schema = useMemo(() => {
    const col = collections.find((c) => c.slug === contextCollectionSlug) || null;
    return isPlainObject(col?.schema) ? col.schema : {};
  }, [collections, contextCollectionSlug]);

  const options = useMemo(() => fieldOptionsFromSchema(schema), [schema]);

  if (!selectedNode) return null;

  const isContainer =
    selectedNode.nodeType === 'row' || selectedNode.nodeType === 'column' || selectedNode.nodeType === 'stack';
  const isBindable =
    selectedNode.nodeType === 'heading' ||
    selectedNode.nodeType === 'text' ||
    selectedNode.nodeType === 'button' ||
    selectedNode.nodeType === 'image' ||
    selectedNode.nodeType === 'rich_text' ||
    selectedNode.nodeType === 'carousel';

  const hasAnyBinding = Object.keys(bindings || {}).length > 0;
  const hasRepeater = Boolean(repeat && typeof repeat.collectionSlug === 'string' && repeat.collectionSlug);

  return (
    <div className="bld-field" style={{ marginTop: 10 }}>
      <div className="bld-panel__subhead" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span>CMS</span>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {hasRepeater ? <span className="bld-chip">Repeater</span> : null}
          {hasAnyBinding ? <span className="bld-chip">Bound to CMS</span> : null}
        </span>
      </div>

      {!canUseCms ? <div className="bld-field-note">CMS needs a project context.</div> : null}
      {error ? <div className="bld-field-note" style={{ color: '#b91c1c' }}>{error}</div> : null}

      {canUseCms ? (
        <div className="bld-field" style={{ marginTop: 8 }}>
          <label className="bld-label">Binding context</label>
          <select
            className="bld-input"
            value={contextCollectionSlug}
            onChange={(e) => onChange('cmsContextCollectionSlug', e.target.value)}
          >
            <option value="">(auto)</option>
            {collections.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.slug})
              </option>
            ))}
          </select>
          <p className="bld-field-note">This controls which fields show in binding dropdowns (uses repeater collection by default).</p>
        </div>
      ) : null}

      {isContainer ? (
        <div className="bld-field" style={{ marginTop: 12 }}>
          <label className="bld-label">Repeater</label>
          <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <div className="bld-field-note" style={{ margin: 0 }}>
              Repeat the first child as a template (preview shows sample item only).
            </div>
            <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={Boolean(repeat)}
                onChange={(e) => onChange('cmsRepeatEnabled', e.target.checked)}
              />
              Enable
            </label>
          </div>

          {repeat ? (
            <>
              <div className="bld-field" style={{ marginTop: 10 }}>
                <label className="bld-label">Collection</label>
                <select
                  className="bld-input"
                  value={repeat.collectionSlug || ''}
                  onChange={(e) => onChange('cmsRepeatPatch', { collectionSlug: e.target.value })}
                >
                  <option value="">Select a collection…</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div className="bld-field">
                  <label className="bld-label">Limit</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    className="bld-input"
                    value={Number(repeat.limit ?? 0)}
                    onChange={(e) => onChange('cmsRepeatPatch', { limit: Number(e.target.value) })}
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Status</label>
                  <select
                    className="bld-input"
                    value={repeat.status === 'draft' ? 'draft' : 'published'}
                    onChange={(e) => onChange('cmsRepeatPatch', { status: e.target.value })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div className="bld-field">
                  <label className="bld-label">Preset</label>
                  <select
                    className="bld-input"
                    value={String(repeat.preset || '')}
                    onChange={(e) => onChange('cmsRepeatPatch', { preset: e.target.value })}
                  >
                    {queryPresetOptions().map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bld-field">
                  <label className="bld-label">Featured only</label>
                  <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(repeat.featuredOnly) || String(repeat.preset) === 'featured'}
                      onChange={(e) => onChange('cmsRepeatPatch', { featuredOnly: e.target.checked })}
                    />
                    Enable
                  </label>
                </div>
              </div>

              {String(repeat.preset) === 'by_category' ? (
                <div className="bld-field" style={{ marginTop: 10 }}>
                  <label className="bld-label">Category</label>
                  <input
                    className="bld-input"
                    value={String(repeat.byCategory || '')}
                    onChange={(e) => onChange('cmsRepeatPatch', { byCategory: e.target.value })}
                    placeholder="e.g. news"
                  />
                </div>
              ) : null}

              {String(repeat.preset) === 'by_tag' ? (
                <div className="bld-field" style={{ marginTop: 10 }}>
                  <label className="bld-label">Tag</label>
                  <input
                    className="bld-input"
                    value={String(repeat.byTag || '')}
                    onChange={(e) => onChange('cmsRepeatPatch', { byTag: e.target.value })}
                    placeholder="e.g. featured"
                  />
                </div>
              ) : null}
              <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div className="bld-field">
                  <label className="bld-label">Sort field</label>
                  <select
                    className="bld-input"
                    value={repeat.sortBy || 'published_at'}
                    onChange={(e) => onChange('cmsRepeatPatch', { sortBy: e.target.value })}
                  >
                    <option value="published_at">published_at</option>
                    <option value="created_at">created_at</option>
                    <option value="updated_at">updated_at</option>
                    <option value="title">title</option>
                  </select>
                </div>
                <div className="bld-field">
                  <label className="bld-label">Direction</label>
                  <select
                    className="bld-input"
                    value={repeat.sortDir === 'asc' ? 'asc' : 'desc'}
                    onChange={(e) => onChange('cmsRepeatPatch', { sortDir: e.target.value })}
                  >
                    <option value="desc">desc</option>
                    <option value="asc">asc</option>
                  </select>
                </div>
              </div>

              <div className="bld-field-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div className="bld-field">
                  <label className="bld-label">Page size</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    className="bld-input"
                    value={Number(repeat.pageSize ?? 0)}
                    onChange={(e) => onChange('cmsRepeatPatch', { pageSize: Number(e.target.value) })}
                  />
                </div>
                <div className="bld-field">
                  <label className="bld-label">Page param</label>
                  <input
                    className="bld-input"
                    value={String(repeat.pageParam || 'page')}
                    onChange={(e) => onChange('cmsRepeatPatch', { pageParam: e.target.value })}
                  />
                </div>
              </div>
              <div className="bld-field" style={{ marginTop: 10 }}>
                <label className="bld-label">Empty state message</label>
                <input
                  className="bld-input"
                  value={String(repeat.emptyMessage || '')}
                  onChange={(e) => onChange('cmsRepeatPatch', { emptyMessage: e.target.value })}
                  placeholder="No items found."
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {isBindable ? (
        <div className="bld-field" style={{ marginTop: 12 }}>
          <label className="bld-label">Bindings</label>
          {!contextCollectionSlug ? (
            <div className="bld-field-note">Pick a binding context collection (or enable repeater) to see fields.</div>
          ) : null}

          {selectedNode.nodeType === 'heading' || selectedNode.nodeType === 'text' ? (
            <div className="bld-field">
              <label className="bld-label">Text</label>
              <select
                className="bld-input"
                value={bindings.text || ''}
                onChange={(e) => onChange('cmsSetBinding', { propKey: 'text', path: e.target.value })}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.path}>
                    {o.label}
                  </option>
                ))}
              </select>
              {bindings.text ? (
                <button type="button" className="bld-chip bld-chip--danger" onClick={() => onChange('cmsClearBinding', { propKey: 'text' })}>
                  Clear binding
                </button>
              ) : null}
            </div>
          ) : null}

          {selectedNode.nodeType === 'button' ? (
            <>
              <div className="bld-field">
                <label className="bld-label">Label</label>
                <select
                  className="bld-input"
                  value={bindings.text || ''}
                  onChange={(e) => onChange('cmsSetBinding', { propKey: 'text', path: e.target.value })}
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.path}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bld-field">
                <label className="bld-label">URL</label>
                <select
                  className="bld-input"
                  value={bindings.href || ''}
                  onChange={(e) => onChange('cmsSetBinding', { propKey: 'href', path: e.target.value })}
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.path}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {bindings.text || bindings.href ? (
                <button type="button" className="bld-chip bld-chip--danger" onClick={() => onChange('cmsClearAllBindings', {})}>
                  Clear all bindings
                </button>
              ) : null}
            </>
          ) : null}

          {selectedNode.nodeType === 'image' ? (
            <>
              <div className="bld-field">
                <label className="bld-label">Image URL</label>
                <select
                  className="bld-input"
                  value={bindings.src || ''}
                  onChange={(e) => onChange('cmsSetBinding', { propKey: 'src', path: e.target.value })}
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.path}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bld-field">
                <label className="bld-label">Alt</label>
                <select
                  className="bld-input"
                  value={bindings.alt || ''}
                  onChange={(e) => onChange('cmsSetBinding', { propKey: 'alt', path: e.target.value })}
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.path}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {bindings.src || bindings.alt ? (
                <button type="button" className="bld-chip bld-chip--danger" onClick={() => onChange('cmsClearAllBindings', {})}>
                  Clear all bindings
                </button>
              ) : null}
            </>
          ) : null}

          <p className="bld-field-note" style={{ marginTop: 6 }}>
            Bindings write placeholders into widget props (e.g. <code>{bindingExpr('item.title')}</code>) and are expanded before render.
          </p>
        </div>
      ) : null}
    </div>
  );
}

