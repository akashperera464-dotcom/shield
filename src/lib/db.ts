import { PrismaClient } from '@prisma/client'

// Reuse a single PrismaClient across hot-reloads in dev + across
// serverless invocations in prod (Vercel). Prisma documents this pattern
// here: https://www.prisma.io/docs/guides/nextjs#best-practices
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
