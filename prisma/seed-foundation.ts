import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { seedSystemRoles } from '../src/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '../src/core/modules/permissions/seed/sync-permissions-foundation'

/**
 * Foundation-only seed (Platform Core).
 *
 * Idempotent. Does not register Domain permissions.
 * Used mid-release before Domain Prisma M4 bootstrap that requires OWNER.
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  await seedSystemRoles(prisma)
  await prisma.$transaction((client) => syncPermissionsFoundation(client))
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
