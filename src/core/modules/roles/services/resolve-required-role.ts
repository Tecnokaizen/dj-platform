import 'server-only'

import {
  ROLE_ERROR_CODES,
  RoleError,
} from '@/core/modules/roles/errors/role-error'
import { requiredSystemRoleKeySchema } from '@/core/modules/roles/schemas/required-system-role-key'
import { findRoleByKey } from '@/core/modules/roles/services/find-role-by-key'
import type { RoleDto } from '@/core/modules/roles/types/role-dto'

export async function resolveRequiredRole(key: string): Promise<RoleDto> {
  const parsed = requiredSystemRoleKeySchema.safeParse(key)

  if (!parsed.success) {
    throw new RoleError(ROLE_ERROR_CODES.INVALID_KEY)
  }

  const role = await findRoleByKey(parsed.data)

  if (!role) {
    throw new RoleError(ROLE_ERROR_CODES.REQUIRED_MISSING)
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
