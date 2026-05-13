import fs from 'node:fs';
import path from 'node:path';

fs.rmSync('.next', { recursive: true, force: true });
console.log('Cleared .next cache');

const webpackCache = path.join('node_modules', '.cache');
if (fs.existsSync(webpackCache)) {
  fs.rmSync(webpackCache, { recursive: true, force: true });
  console.log('Cleared node_modules/.cache');
}
