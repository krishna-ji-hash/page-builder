import { fail, ok } from '@/lib/api';
import { getPlatformHealth } from '@/services/platform/platformHealthService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await getPlatformHealth();
    return ok(health);
  } catch (error) {
    return fail('Failed to load platform health', 500, error.message);
  }
}
