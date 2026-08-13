import 'server-only'

import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'
import {
  ROLE_ERROR_CODES,
  RoleError,
} from '@/core/modules/roles/errors/role-error'
import { findRoleByKey } from '@/core/modules/roles/services/find-role-by-key'

export async function validateSystemRoleCatalog(): Promise<void> {
  for (const expected of SYSTEM_ROLE_METADATA) {
    const role = await findRoleByKey(expected.key)

    if (!role) {
      throw new RoleError(ROLE_ERROR_CODES.REQUIRED_MISSING)
    }

    if (!role.isSystem) {
      throw new RoleError(ROLE_ERROR_CODES.INVALID)
    }
  }
}
