export const PROFILE_ERROR_CODES = {
  NOT_FOUND: 'PROFILE_NOT_FOUND',
} as const

export type ProfileErrorCode =
  (typeof PROFILE_ERROR_CODES)[keyof typeof PROFILE_ERROR_CODES]

export class ProfileError extends Error {
  readonly code: ProfileErrorCode

  constructor(code: ProfileErrorCode) {
    super(code)
    this.name = 'ProfileError'
    this.code = code
  }
}
