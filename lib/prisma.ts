import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Neon's serverless driver needs a WebSocket implementation in the Node
// runtime (Next.js server process) -- Node 22+ has a native WebSocket
// global, but pinning `ws` explicitly matches Neon's own documented setup
// and keeps this working on any Node version this app might run under.
neonConfig.webSocketConstructor = ws

function sanitizeConnectionString(name: string, raw: string | undefined): string | undefined {
  if (!raw) return raw
  // Strips accidental wrapping quotes/whitespace from env values pasted from
  // .env's KEY="value" dotenv syntax straight into a dashboard UI -- the raw
  // Neon Pool constructor calls `new URL()` internally and throws
  // ERR_INVALID_URL on a leading/trailing `"` that older engine-based
  // parsing silently tolerated.
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, '').trim()
  if (!cleaned.startsWith('postgres://') && !cleaned.startsWith('postgresql://')) {
    console.warn(`[prisma] ${name} does not look like a valid postgres connection string`)
  }
  return cleaned
}

// Only retry errors that look like a transient network/pool hiccup (cold
// start, closed socket, timeout) -- never retry on things like a bad
// password or a missing table, which will just fail again identically and
// waste 3x the time before surfacing the same error.
function isTransientConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /ConnectionError|Closed|ETIMEDOUT|ECONNRESET|connection timeout|Timed out|socket hang up/i.test(message)
    && !/Authentication failed/i.test(message)
}

const RETRY_DELAYS_MS = [200, 500]

const prismaClientSingleton = () => {
  // The Neon adapter opens connections over HTTP/WebSocket rather than a
  // long-lived raw TCP socket, so a compute auto-suspend/resume cycle never
  // surfaces as a `kind: Closed` error from a stale pooled connection --
  // each query just reconnects transparently.
  const connectionString = sanitizeConnectionString('DATABASE_URL', process.env.DATABASE_URL)
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)

  const client = new PrismaClient({
    adapter,
    // Surface pool/connection warnings in dev logs instead of only finding
    // out about them when a query throws. Never crashes the process --
    // Prisma's own log events are just console output.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  })

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          for (let attempt = 0; ; attempt++) {
            try {
              return await query(args)
            } catch (err) {
              if (attempt >= RETRY_DELAYS_MS.length || !isTransientConnectionError(err)) throw err
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
            }
          }
        },
      },
    },
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
