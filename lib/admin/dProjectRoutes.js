export const D_PROJECTS_PATH = '/d/projects';
export const D_PROJECT_NEW_PATH = '/d/projects/new';

export function dProjectPagesPath(projectId) {
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return D_PROJECTS_PATH;
  return `/d/projects/${id}/pages`;
}

export function dProjectMenusPath(projectId) {
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return D_PROJECTS_PATH;
  return `/d/projects/${id}/menus`;
}

export function dProjectMediaPath(projectId) {
  const id = Number(projectId);
  if (!Number.isInteger(id) || id <= 0) return D_PROJECTS_PATH;
  return `/d/projects/${id}/media`;
}
