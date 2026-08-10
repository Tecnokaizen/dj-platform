export const ROLE_ERROR_CODES = {
  NOT_FOUND: 'ROLE_NOT_FOUND',
  KEY_CONFLICT: 'ROLE_KEY_CONFLICT',
  INVALID: 'ROLE_INVALID',
  REQUIRED_MISSING: 'REQUIRED_ROLE_MISSING',
  SYSTEM_PROTECTED: 'SYSTEM_ROLE_PROTECTED',
  INVALID_KEY: 'INVALID_ROLE_KEY',
} as const

export type RoleErrorCode =
  (typeof ROLE_ERROR_CODES)[keyof typeof ROLE_ERROR_CODES]

export class RoleError extends Error {
  readonly code: RoleErrorCode

  constructor(code: RoleErrorCode) {
    super(code)
    this.name = 'RoleError'
    this.code = code
  }
}
