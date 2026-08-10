export const SYSTEM_ROLE_KEYS = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const

export type SystemRoleKey =
  (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS]
