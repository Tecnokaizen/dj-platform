import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma/client'

export async function findRoleByKey(
  key: string
): Promise<Role | null> {
  return prisma.role.findUnique({
    where: { key },
  })
}
