import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'

import { getServerEnvironment } from '@/config/environment'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL: connectionString } = getServerEnvironment()

  const adapter = new PrismaPg({
    connectionString,
  })

  return new PrismaClient({
    adapter,
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
