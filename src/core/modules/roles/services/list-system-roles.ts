import 'server-only'

import { findSystemRoles } from '@/core/modules/roles/services/find-system-roles'
import type { RoleDto } from '@/core/modules/roles/types/role-dto'

export async function listSystemRoles(): Promise<RoleDto[]> {
  const roles = await findSystemRoles()

  return roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    sortOrder: role.sortOrder,
  }))
}
