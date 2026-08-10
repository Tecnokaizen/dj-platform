import {
  SYSTEM_ROLE_KEYS,
  type SystemRoleKey,
} from '@/core/modules/roles/constants/system-role-keys'

export type SystemRoleMetadata = {
  key: SystemRoleKey
  name: string
  description: null
  isSystem: true
  sortOrder: number
}

export const SYSTEM_ROLE_METADATA = [
  {
    key: SYSTEM_ROLE_KEYS.OWNER,
    name: 'Owner',
    description: null,
    isSystem: true,
    sortOrder: 10,
  },
  {
    key: SYSTEM_ROLE_KEYS.ADMIN,
    name: 'Admin',
    description: null,
    isSystem: true,
    sortOrder: 20,
  },
  {
    key: SYSTEM_ROLE_KEYS.MANAGER,
    name: 'Manager',
    description: null,
    isSystem: true,
    sortOrder: 30,
  },
  {
    key: SYSTEM_ROLE_KEYS.MEMBER,
    name: 'Member',
    description: null,
    isSystem: true,
    sortOrder: 40,
  },
  {
    key: SYSTEM_ROLE_KEYS.VIEWER,
    name: 'Viewer',
    description: null,
    isSystem: true,
    sortOrder: 50,
  },
] as const satisfies readonly SystemRoleMetadata[]
