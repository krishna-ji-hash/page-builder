import fs from 'node:fs';
import path from 'node:path';
import { killPort } from './dev-utils.mjs';

const PORT = Number(process.env.PORT || 3000);

killPort(PORT);
killPort(3001);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rmWithRetry(target, attempts = 8, delayMs = 400) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      return true;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await sleep(delayMs);
    }
  }
  return false;
}

await rmWithRetry('.next');
console.log('Cleared .next cache');

const webpackCache = path.join('node_modules', '.cache');
if (fs.existsSync(webpackCache)) {
  await rmWithRetry(webpackCache);
  console.log('Cleared node_modules/.cache');
}

console.log('');
console.log('Next: npm run dev');
console.log('Wait until you see: [dev] Builder ready — then open the builder in your browser.');
console.log('Do NOT run clean-next before every dev start (only when chunks are corrupt).');
