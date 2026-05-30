import fs from 'node:fs';
import path from 'node:path';
import { killPort } from './dev-utils.mjs';

const PORT = Number(process.env.PORT || 3000);

killPort(PORT);
killPort(3001);

fs.rmSync('.next', { recursive: true, force: true });
console.log('Cleared .next cache');

const webpackCache = path.join('node_modules', '.cache');
if (fs.existsSync(webpackCache)) {
  fs.rmSync(webpackCache, { recursive: true, force: true });
  console.log('Cleared node_modules/.cache');
}

console.log('');
console.log('Next: npm run dev');
console.log('Wait until you see: [dev] Builder ready — then open the builder in your browser.');
console.log('Do NOT run clean-next before every dev start (only when chunks are corrupt).');
