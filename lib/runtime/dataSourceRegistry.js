/**
 * Approved internal runtime data resources. All paths must be under /api/runtime/data/{resource}.
 * Used by the runtime API, DynamicTable, DynamicForm, and the builder inspector.
 */

const usersColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];
const usersFields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
];

const leadsColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
];
const leadsFields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'company', label: 'Company', type: 'text', required: false },
];

const ordersColumns = [
  { key: 'id', label: 'ID' },
  { key: 'orderNo', label: 'Order' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
];
const ordersFields = [
  { name: 'orderNo', label: 'Order', type: 'text', required: true },
  { name: 'total', label: 'Total', type: 'number', required: true },
];

/** @type {Record<string, { key: string; label: string; allowedMethods: string[]; endpoint: { GET?: string; POST?: string }; defaultColumns: { key: string; label: string }[]; defaultFields: { name: string; label: string; type: string; required?: boolean }[]; id: string; path: string; columns: { key: string; label: string }[]; postBodyFields?: { key: string; type: 'string' | 'email' | 'number'; required?: boolean }[] }>} */
export const dataSourceRegistry = {
  users: {
    key: 'users',
    label: 'Users',
    endpoint: {
      GET: '/api/runtime/data/users',
      POST: '/api/runtime/data/users',
    },
    defaultColumns: usersColumns,
    defaultFields: usersFields,
    id: 'users',
    path: '/api/runtime/data/users',
    allowedMethods: ['GET', 'POST'],
    columns: usersColumns,
    postBodyFields: [
      { key: 'name', type: 'string', required: true },
      { key: 'email', type: 'email', required: true },
    ],
  },
  leads: {
    key: 'leads',
    label: 'Leads',
    endpoint: {
      GET: '/api/runtime/data/leads',
      POST: '/api/runtime/data/leads',
    },
    defaultColumns: leadsColumns,
    defaultFields: leadsFields,
    id: 'leads',
    path: '/api/runtime/data/leads',
    allowedMethods: ['GET', 'POST'],
    columns: leadsColumns,
    postBodyFields: [
      { key: 'name', type: 'string', required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'company', type: 'string', required: false },
    ],
  },
  orders: {
    key: 'orders',
    label: 'Orders',
    endpoint: {
      GET: '/api/runtime/data/orders',
    },
    defaultColumns: ordersColumns,
    defaultFields: ordersFields,
    id: 'orders',
    path: '/api/runtime/data/orders',
    allowedMethods: ['GET'],
    columns: ordersColumns,
  },
};

const PATH_PREFIX = '/api/runtime/data/';

/**
 * @param {string} resource
 * @returns {typeof dataSourceRegistry[keyof typeof dataSourceRegistry] | null}
 */
export function getDataSourceDefinition(resource) {
  if (typeof resource !== 'string' || !resource) return null;
  return dataSourceRegistry[resource] || null;
}

/**
 * @param {string} path
 * @returns {string | null} resource id
 */
export function getResourceIdFromPath(path) {
  if (typeof path !== 'string' || !path.startsWith(PATH_PREFIX)) return null;
  const rest = path.slice(PATH_PREFIX.length).replace(/\/$/, '');
  if (!rest || rest.includes('/')) return null;
  return getDataSourceDefinition(rest) ? rest : null;
}

/**
 * @param {string} resource
 * @param {string} method
 * @returns {boolean}
 */
export function isMethodAllowedForResource(resource, method) {
  const def = getDataSourceDefinition(resource);
  if (!def) return false;
  const m = (method || 'GET').toUpperCase();
  return def.allowedMethods.includes(m);
}

/**
 * Columns for a known resource, or null if path is not an approved resource.
 * @param {string} path
 * @returns {{ key: string; label: string }[] | null}
 */
export function getColumnsForPath(path) {
  const id = getResourceIdFromPath(path);
  if (!id) return null;
  const def = getDataSourceDefinition(id);
  return def ? [...def.columns] : null;
}

/**
 * Fields for a known resource, or null if unknown path.
 * @param {string} path
 * @returns {{ name: string; label: string; type: string; required?: boolean }[] | null}
 */
export function getFieldsForPath(path) {
  const id = getResourceIdFromPath(path);
  if (!id) return null;
  const def = getDataSourceDefinition(id);
  return def ? [...(def.defaultFields || [])] : null;
}

/**
 * @returns {string[]}
 */
export function listResourceIds() {
  return Object.keys(dataSourceRegistry);
}
