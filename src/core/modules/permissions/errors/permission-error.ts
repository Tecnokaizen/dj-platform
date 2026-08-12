export const PERMISSION_ERROR_CODES = {
  NOT_FOUND: 'PERMISSION_NOT_FOUND',
  REQUIRED_MISSING: 'REQUIRED_PERMISSION_MISSING',
  DENIED: 'PERMISSION_DENIED',
  CATALOG_DRIFT: 'PERMISSION_CATALOG_DRIFT',
  POLICY_DRIFT: 'ROLE_PERMISSION_POLICY_DRIFT',
  INVALID_KEY: 'INVALID_PERMISSION_KEY',
} as const

export type PermissionErrorCode =
  (typeof PERMISSION_ERROR_CODES)[keyof typeof PERMISSION_ERROR_CODES]

export class PermissionError extends Error {
  readonly code: PermissionErrorCode

  constructor(code: PermissionErrorCode) {
    super(code)
    this.name = 'PermissionError'
    this.code = code
  }
}
