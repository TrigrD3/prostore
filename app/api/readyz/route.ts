import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      { err: error, event: 'readyz.database_check_failed' },
      'Readiness check failed'
    );
    return NextResponse.json(
      {
        status: 'unready',
        error: 'Database check failed',
      },
      { status: 503 }
    );
  }
}
