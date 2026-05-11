import { runMigrations } from '../lib/runMigrations.mjs';

runMigrations().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
