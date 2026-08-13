export const AUTH_PUBLIC_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  REGISTRATION_FAILED: 'registration_failed',
  PROFILE_UPDATE_FAILED: 'profile_update_failed',
  AUTH_CALLBACK_FAILED: 'auth_callback_failed',
} as const

export type AuthPublicErrorCode =
  (typeof AUTH_PUBLIC_ERROR_CODES)[keyof typeof AUTH_PUBLIC_ERROR_CODES]

const AUTH_PUBLIC_ERROR_MESSAGES: Record<AuthPublicErrorCode, string> = {
  [AUTH_PUBLIC_ERROR_CODES.INVALID_CREDENTIALS]:
    'No se pudo iniciar sesión. Revisa tu email y contraseña.',
  [AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FAILED]:
    'No se pudo crear la cuenta. Inténtalo de nuevo.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_UPDATE_FAILED]:
    'No se pudo actualizar el perfil. Inténtalo de nuevo.',
  [AUTH_PUBLIC_ERROR_CODES.AUTH_CALLBACK_FAILED]:
    'No se pudo completar la autenticación. Inténtalo de nuevo.',
}

export function isAuthPublicErrorCode(
  value: string | undefined
): value is AuthPublicErrorCode {
  return (
    value !== undefined &&
    Object.values(AUTH_PUBLIC_ERROR_CODES).includes(
      value as AuthPublicErrorCode
    )
  )
}

export function getAuthPublicErrorMessage(
  code: string | undefined,
  fallback?: string
): string | null {
  if (!code) {
    return null
  }

  if (isAuthPublicErrorCode(code)) {
    return AUTH_PUBLIC_ERROR_MESSAGES[code]
  }

  return fallback ?? null
}
