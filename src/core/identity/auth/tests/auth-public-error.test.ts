import { describe, expect, it } from 'vitest'

import {
  AUTH_PUBLIC_ERROR_CODES,
  getAuthPublicErrorMessage,
  isAuthPublicErrorCode,
} from '@/core/identity/auth/errors/auth-public-error'

describe('auth public error mapping', () => {
  it('maps stable codes to safe application messages', () => {
    expect(
      getAuthPublicErrorMessage(AUTH_PUBLIC_ERROR_CODES.INVALID_CREDENTIALS)
    ).toContain('iniciar sesión')
    expect(
      getAuthPublicErrorMessage(AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FAILED)
    ).toContain('crear la cuenta')
    expect(
      getAuthPublicErrorMessage(AUTH_PUBLIC_ERROR_CODES.PROFILE_UPDATE_FAILED)
    ).toContain('actualizar el perfil')
  })

  it('does not treat provider-like strings as public codes', () => {
    expect(isAuthPublicErrorCode('Invalid login credentials')).toBe(false)
    expect(getAuthPublicErrorMessage('Invalid login credentials')).toBeNull()
  })
})
