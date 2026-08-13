export const ORGANIZATION_ERROR_CODES = {
  NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  SLUG_CONFLICT: 'ORGANIZATION_SLUG_CONFLICT',
  INVALID_STATE: 'INVALID_ORGANIZATION_STATE',
  UPDATE_EMPTY: 'ORGANIZATION_UPDATE_EMPTY',
} as const

export type OrganizationErrorCode =
  (typeof ORGANIZATION_ERROR_CODES)[keyof typeof ORGANIZATION_ERROR_CODES]

export class OrganizationError extends Error {
  readonly code: OrganizationErrorCode

  constructor(code: OrganizationErrorCode) {
    super(code)
    this.name = 'OrganizationError'
    this.code = code
  }
}
