import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { seedSystemRoles } from '../src/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '../src/core/modules/permissions/seed/sync-permissions-foundation'
import { seedDjStudioDomainPermissions } from '../src/domains/dj-studio/permissions/seed-dj-studio-permissions'

/**
 * Product / composition seed orchestrator.
 *
 * Core foundation remains Domain-agnostic.
 * DJ Studio Domain registration is composed here (Product layer), not inside Core.
 *
 * Idempotent. Safe after `seed-foundation.ts` (Foundation seed runs again harmlessly).
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida')
}

const adapter = new PrismaPg({
  connectionString,
})

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  await seedSystemRoles(prisma)
  await prisma.$transaction((client) => syncPermissionsFoundation(client))
  await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
