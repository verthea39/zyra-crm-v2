import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Neon's serverless driver needs a WebSocket implementation in the Node
// runtime (Next.js server process) -- Node 22+ has a native WebSocket
// global, but pinning `ws` explicitly matches Neon's own documented setup
// and keeps this working on any Node version this app might run under.
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  // The Neon adapter opens connections over HTTP/WebSocket rather than a
  // long-lived raw TCP socket, so a compute auto-suspend/resume cycle never
  // surfaces as a `kind: Closed` error from a stale pooled connection --
  // each query just reconnects transparently.
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)

  return new PrismaClient({
    adapter,
    // Surface pool/connection warnings in dev logs instead of only finding
    // out about them when a query throws. Never crashes the process --
    // Prisma's own log events are just console output.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
