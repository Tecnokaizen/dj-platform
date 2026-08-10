import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma/client'

export async function findSystemRoles(): Promise<Role[]> {
  return prisma.role.findMany({
    where: { isSystem: true },
    orderBy: { sortOrder: 'asc' },
  })
}
