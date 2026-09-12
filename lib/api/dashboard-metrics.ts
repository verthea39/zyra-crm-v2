import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export interface DashboardMetrics {
  activePipeline: number;
  activeLeads: number;
  winRate: number;
  urgentFollowUps: number;
  complianceAlerts: number;
}

const DASHBOARD_METRICS_KEY = 'crm:metrics:dashboard';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function getCachedDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // 1. Attempt reading from Redis
    const cached = await redis.get<DashboardMetrics>(DASHBOARD_METRICS_KEY);
    if (cached) {
      return cached;
    }
  } catch (error) {
    // Fail gracefully to database if Redis is temporarily unreachable
    console.error('Redis cache lookup failed, falling back to database:', error);
  }

  // 2. Cache Miss: Execute parallel counts in PostgreSQL
  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  const [
    pipelineAgg,
    activeLeads,
    wonDeals,
    lostDeals,
    urgentTasks,
    expiringDocs
  ] = await prisma.$transaction([
    prisma.deal.aggregate({
      where: { stage: { notIn: ['WON', 'LOST'] } },
      _sum: { valueMinor: true }
    }),
    prisma.lead.count({
      where: { status: { notIn: ['LOST', 'QUALIFIED'] } }
    }),
    prisma.deal.count({ where: { stage: 'WON' } }),
    prisma.deal.count({ where: { stage: 'LOST' } }),
    prisma.task.count({
      where: {
        status: 'PENDING',
        dueDate: { lte: now }
      }
    }),
    prisma.document.count({
      where: {
        expiryDate: { lte: sixtyDaysFromNow, gt: new Date(2000, 0, 1) }
      }
    })
  ]);

  const totalFinished = wonDeals + lostDeals;
  const winRate = totalFinished > 0 ? Math.round((wonDeals / totalFinished) * 100) : 0;

  const metrics: DashboardMetrics = {
    activePipeline: Number(pipelineAgg._sum.valueMinor ?? 0) / 100,
    activeLeads,
    winRate,
    urgentFollowUps: urgentTasks,
    complianceAlerts: expiringDocs
  };

  // 3. Set Redis key with an explicit expiration (TTL)
  try {
    await redis.set(DASHBOARD_METRICS_KEY, metrics, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('Failed to write metrics to Redis:', error);
  }

  return metrics;
}

// 4. Manual on-demand invalidation helper
export async function invalidateDashboardMetricsCache(): Promise<void> {
  try {
    await redis.del(DASHBOARD_METRICS_KEY);
  } catch (error) {
    console.error('Failed to invalidate Redis metrics cache:', error);
  }
}
