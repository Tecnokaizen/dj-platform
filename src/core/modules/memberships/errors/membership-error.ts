export const MEMBERSHIP_ERROR_CODES = {
  NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  NOT_ACTIVE: 'MEMBERSHIP_NOT_ACTIVE',
  SUSPENDED: 'MEMBERSHIP_SUSPENDED',
  REMOVED: 'MEMBERSHIP_REMOVED',
  INVALID_STATE: 'INVALID_MEMBERSHIP_STATE',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  ROLE_INVALID: 'ROLE_INVALID',
  OWNER_TRANSFER_REQUIRED: 'OWNER_TRANSFER_REQUIRED',
  OWNER_INVARIANT_VIOLATION: 'OWNER_INVARIANT_VIOLATION',
} as const

export type MembershipErrorCode =
  (typeof MEMBERSHIP_ERROR_CODES)[keyof typeof MEMBERSHIP_ERROR_CODES]

export class MembershipError extends Error {
  readonly code: MembershipErrorCode

  constructor(code: MembershipErrorCode) {
    super(code)
    this.name = 'MembershipError'
    this.code = code
  }
}
