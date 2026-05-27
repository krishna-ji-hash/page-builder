import path from 'node:path';
import { pathToFileURL } from 'node:url';

function tryResolveAlias(specifier, projectRoot) {
  if (!specifier || typeof specifier !== 'string') return null;
  if (!specifier.startsWith('@/')) return null;
  // Map `@/x/y` -> `<root>/x/y`
  const rel = specifier.slice(2);
  const abs = path.join(projectRoot, rel);
  return pathToFileURL(abs).href;
}

export async function resolve(specifier, context, defaultResolve) {
  const projectRoot = process.cwd();
  const mapped = tryResolveAlias(specifier, projectRoot);
  if (mapped) {
    // Let Node handle extension / index resolution from the mapped file URL.
    return defaultResolve(mapped, context, defaultResolve);
  }
  return defaultResolve(specifier, context, defaultResolve);
}

