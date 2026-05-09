// Relative import so Node test runner resolves without Next.js aliasing.
import { isCapability } from './capabilities.js';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

const state = {
  apps: new Map(), // appId -> manifest
  widgetsByProjectType: new Map(), // projectType -> Map(widgetType -> def)
  cmsCollections: new Map(), // collectionSlug -> schema preset
  templates: new Map(), // templateId -> template descriptor (section/full page)
  inspectorPanels: [], // [{ id, when, render }]
  routes: new Map(), // routeId -> descriptor (manifest only)
};

export function resetAppRegistry() {
  state.apps = new Map();
  state.widgetsByProjectType = new Map();
  state.cmsCollections = new Map();
  state.templates = new Map();
  state.inspectorPanels = [];
  state.routes = new Map();
}

function ensureMap(map, key) {
  const cur = map.get(key);
  if (cur) return cur;
  const next = new Map();
  map.set(key, next);
  return next;
}

function assertUnique(map, key, kind) {
  if (map.has(key)) {
    throw new Error(`${kind} already registered: ${key}`);
  }
}

function assertAppCapability(appId, cap) {
  const m = state.apps.get(appId);
  const caps = Array.isArray(m?.capabilities) ? m.capabilities : [];
  if (!caps.includes(cap)) {
    throw new Error(`App ${appId} missing capability: ${cap}`);
  }
}

export function registerApp(manifest) {
  const m = isPlainObject(manifest) ? manifest : {};
  const id = typeof m.id === 'string' ? m.id.trim() : '';
  if (!id) throw new Error('App id is required');
  if (!/^[a-z0-9-_.]{2,60}$/i.test(id)) throw new Error(`Invalid app id: ${id}`);
  const capabilities = Array.isArray(m.capabilities) ? m.capabilities.map(String) : [];
  for (const c of capabilities) {
    if (!isCapability(c)) throw new Error(`Unknown capability: ${c}`);
  }
  assertUnique(state.apps, id, 'App');
  state.apps.set(id, { ...m, id, capabilities });
  return id;
}

/**
 * Widgets are additive definitions for existing core-rendered widget types.
 * Safety: apps cannot introduce new renderTree nodeTypes.
 */
export function registerWidget(appId, projectType, widgetDef) {
  assertAppCapability(appId, 'widgets');
  const pt = typeof projectType === 'string' && projectType.trim() ? projectType.trim() : 'website';
  const def = isPlainObject(widgetDef) ? widgetDef : {};
  const type = typeof def.type === 'string' ? def.type.trim() : '';
  if (!type) throw new Error('Widget type is required');
  // NOTE: nodeType == widget type in this builder; keep strict to existing types only.
  const allowedCoreTypes = new Set([
    'heading',
    'text',
    'rich_text',
    'image',
    'button',
    'menu',
    'carousel',
    'table',
    'form',
    'input',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'switch',
    'date',
    'submit',
  ]);
  if (!allowedCoreTypes.has(type)) {
    throw new Error(`Widget type not supported by core renderer: ${type}`);
  }

  const target = ensureMap(state.widgetsByProjectType, pt);
  if (target.has(type)) {
    throw new Error(`Widget already registered for ${pt}: ${type}`);
  }
  target.set(type, { ...def, type, _appId: appId });
}

export function registerCmsCollection(appId, preset) {
  assertAppCapability(appId, 'cms_access');
  const p = isPlainObject(preset) ? preset : {};
  const slug = typeof p.slug === 'string' ? p.slug.trim().toLowerCase() : '';
  if (!slug) throw new Error('Collection slug is required');
  if (!/^[a-z0-9-_]{2,60}$/.test(slug)) throw new Error(`Invalid collection slug: ${slug}`);
  assertUnique(state.cmsCollections, slug, 'CMS collection');
  state.cmsCollections.set(slug, { ...p, slug, _appId: appId });
}

export function registerTemplate(appId, template) {
  assertAppCapability(appId, 'templates');
  const t = isPlainObject(template) ? template : {};
  const id = typeof t.id === 'string' ? t.id.trim() : '';
  if (!id) throw new Error('Template id is required');
  assertUnique(state.templates, id, 'Template');
  state.templates.set(id, { ...t, id, _appId: appId });
}

export function registerInspectorPanel(appId, panel) {
  assertAppCapability(appId, 'inspector_panels');
  const p = isPlainObject(panel) ? panel : {};
  const id = typeof p.id === 'string' ? p.id.trim() : '';
  if (!id) throw new Error('Inspector panel id is required');
  if (state.inspectorPanels.some((x) => x.id === id)) throw new Error(`Inspector panel already registered: ${id}`);
  state.inspectorPanels.push({ ...p, id, _appId: appId });
}

export function registerDynamicRoute(appId, route) {
  assertAppCapability(appId, 'dynamic_routes');
  const r = isPlainObject(route) ? route : {};
  const id = typeof r.id === 'string' ? r.id.trim() : '';
  if (!id) throw new Error('Route id is required');
  assertUnique(state.routes, id, 'Route');
  state.routes.set(id, { ...r, id, _appId: appId });
}

export function getRegisteredWidgets(projectType) {
  const pt = typeof projectType === 'string' ? projectType : 'website';
  const map = state.widgetsByProjectType.get(pt);
  return map ? Object.fromEntries(map.entries()) : {};
}

export function getRegisteredCmsCollections() {
  return Array.from(state.cmsCollections.values());
}

export function getRegisteredTemplates() {
  return Array.from(state.templates.values());
}

export function getRegisteredApps() {
  return Array.from(state.apps.values());
}

