import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
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
