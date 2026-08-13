import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma/client'

export async function findRoleById(
  roleId: string
): Promise<Role | null> {
  return prisma.role.findUnique({
    where: { id: roleId },
  })
}
