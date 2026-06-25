import { NextResponse } from 'next/server';
import { buildHealthReport } from '@/lib/db/dbHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await buildHealthReport();
    const statusCode = report.status === 'error' ? 503 : 200;
    return NextResponse.json(report, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        app: 'error',
        mysql: 'unknown',
        prisma: 'unknown',
        migrations: 'unknown',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        timestamp: new Date().toISOString(),
        version: 'unknown',
        error: error?.message || 'Health check failed',
      },
      { status: 503 }
    );
  }
}
