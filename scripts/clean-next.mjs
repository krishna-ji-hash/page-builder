import fs from 'node:fs';

fs.rmSync('.next', { recursive: true, force: true });
console.log('Cleared .next cache');
