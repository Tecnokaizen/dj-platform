import type { PrismaClient } from '@/generated/prisma/client'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'

const SYSTEM_ROLE_SEED = [
  {
    key: SYSTEM_ROLE_KEYS.OWNER,
    name: 'Owner',
    sortOrder: 10,
  },
  {
    key: SYSTEM_ROLE_KEYS.ADMIN,
    name: 'Admin',
    sortOrder: 20,
  },
  {
    key: SYSTEM_ROLE_KEYS.MANAGER,
    name: 'Manager',
    sortOrder: 30,
  },
  {
    key: SYSTEM_ROLE_KEYS.MEMBER,
    name: 'Member',
    sortOrder: 40,
  },
  {
    key: SYSTEM_ROLE_KEYS.VIEWER,
    name: 'Viewer',
    sortOrder: 50,
  },
] as const

export async function seedSystemRoles(prisma: PrismaClient): Promise<void> {
  for (const role of SYSTEM_ROLE_SEED) {
    await prisma.role.upsert({
      where: {
        key: role.key,
      },
      create: {
        key: role.key,
        name: role.name,
        description: null,
        isSystem: true,
        sortOrder: role.sortOrder,
      },
      update: {
        name: role.name,
        isSystem: true,
        sortOrder: role.sortOrder,
      },
    })
  }
}
