import 'server-only'

import type { Role } from '@/generated/prisma/client'

export function isOwnerRole(role: Pick<Role, 'key'>): boolean {
  return role.key === 'OWNER'
}
