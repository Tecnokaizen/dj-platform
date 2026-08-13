import { z } from 'zod'

import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'

const REQUIRED_SYSTEM_ROLE_KEY_VALUES = [
  SYSTEM_ROLE_KEYS.OWNER,
  SYSTEM_ROLE_KEYS.ADMIN,
  SYSTEM_ROLE_KEYS.MANAGER,
  SYSTEM_ROLE_KEYS.MEMBER,
  SYSTEM_ROLE_KEYS.VIEWER,
] as const

export const requiredSystemRoleKeySchema = z.enum(REQUIRED_SYSTEM_ROLE_KEY_VALUES)
