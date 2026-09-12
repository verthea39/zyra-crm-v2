import { PrismaClient } from "@prisma/client";

// Prevent creating a new PrismaClient on every hot-reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const SLOW_QUERY_THRESHOLD_MS = 200;

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  });

  // @ts-ignore - Prisma dynamic types for events
  client.$on('query', (event: any) => {
    if (event.duration >= SLOW_QUERY_THRESHOLD_MS) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          type: 'slow_query',
          duration_ms: event.duration,
          query: event.query,
          target: event.target,
          environment: process.env.NODE_ENV,
        })
      );
    }
  });

  return client;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();
export const prisma = db; // Export as prisma too for compatibility

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
