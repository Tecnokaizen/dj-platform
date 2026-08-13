export const INVITATION_ERROR_CODES = {
  NOT_FOUND: 'INVITATION_NOT_FOUND',
  ALREADY_PENDING: 'INVITATION_ALREADY_PENDING',
  NOT_PENDING: 'INVITATION_NOT_PENDING',
  EXPIRED: 'INVITATION_EXPIRED',
  REVOKED: 'INVITATION_REVOKED',
  ALREADY_ACCEPTED: 'INVITATION_ALREADY_ACCEPTED',
  RECIPIENT_MISMATCH: 'INVITATION_RECIPIENT_MISMATCH',
  TOKEN_INVALID: 'INVITATION_TOKEN_INVALID',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
} as const

export type InvitationErrorCode =
  (typeof INVITATION_ERROR_CODES)[keyof typeof INVITATION_ERROR_CODES]

export class InvitationError extends Error {
  readonly code: InvitationErrorCode

  constructor(code: InvitationErrorCode) {
    super(code)
    this.name = 'InvitationError'
    this.code = code
  }
}
