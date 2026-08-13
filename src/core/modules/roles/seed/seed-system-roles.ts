import type { PrismaClient } from '@/generated/prisma/client'
import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'

export async function seedSystemRoles(prisma: PrismaClient): Promise<void> {
  for (const role of SYSTEM_ROLE_METADATA) {
    await prisma.role.upsert({
      where: {
        key: role.key,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        sortOrder: role.sortOrder,
      },
      update: {
        name: role.name,
        isSystem: role.isSystem,
        sortOrder: role.sortOrder,
      },
    })
  }
}
