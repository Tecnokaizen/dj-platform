import 'server-only'

import {
  ROLE_ERROR_CODES,
  RoleError,
} from '@/core/modules/roles/errors/role-error'
import { roleIdSchema } from '@/core/modules/roles/schemas/role-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import type { RoleDto } from '@/core/modules/roles/types/role-dto'

export async function getRole(roleId: string): Promise<RoleDto> {
  const parsed = roleIdSchema.safeParse(roleId)

  if (!parsed.success) {
    throw new RoleError(ROLE_ERROR_CODES.INVALID)
  }

  const role = await findRoleById(parsed.data)

  if (!role) {
    throw new RoleError(ROLE_ERROR_CODES.NOT_FOUND)
  }

  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    sortOrder: role.sortOrder,
  }
}
