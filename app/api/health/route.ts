import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Lightweight ping to PostgreSQL via Prisma
    await prisma.$queryRaw`SELECT 1`;

    // 2. Lightweight ping to Upstash Redis
    await redis.ping();

    const latency = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        services: {
          database: 'connected',
          redis: 'connected',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Health Check Failed]:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Service check failed',
      },
      { status: 503 }
    );
  }
}
