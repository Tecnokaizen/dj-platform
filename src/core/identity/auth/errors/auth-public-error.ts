export const AUTH_PUBLIC_ERROR_CODES = {
  REQUIRED_CREDENTIALS: 'required_credentials',
  INVALID_CREDENTIALS: 'invalid_credentials',
  REGISTRATION_FIELDS_REQUIRED: 'registration_fields_required',
  PASSWORD_TOO_SHORT: 'password_too_short',
  PASSWORD_MISMATCH: 'password_mismatch',
  REGISTRATION_FAILED: 'registration_failed',
  PROFILE_DISPLAY_NAME_REQUIRED: 'profile_display_name_required',
  PROFILE_DISPLAY_NAME_TOO_LONG: 'profile_display_name_too_long',
  PROFILE_DJ_NAME_TOO_LONG: 'profile_dj_name_too_long',
  PROFILE_BIO_TOO_LONG: 'profile_bio_too_long',
  PROFILE_LANGUAGE_INVALID: 'profile_language_invalid',
  PROFILE_UPDATE_FAILED: 'profile_update_failed',
  AUTH_CALLBACK_FAILED: 'auth_callback_failed',
} as const

export const AUTH_PUBLIC_MESSAGE_CODES = {
  ACCOUNT_CREATED: 'account_created',
  PROFILE_UPDATED: 'profile_updated',
} as const

export type AuthPublicErrorCode =
  (typeof AUTH_PUBLIC_ERROR_CODES)[keyof typeof AUTH_PUBLIC_ERROR_CODES]

const AUTH_PUBLIC_ERROR_MESSAGES: Record<AuthPublicErrorCode, string> = {
  [AUTH_PUBLIC_ERROR_CODES.REQUIRED_CREDENTIALS]:
    'Introduce tu email y contraseña.',
  [AUTH_PUBLIC_ERROR_CODES.INVALID_CREDENTIALS]:
    'No se pudo iniciar sesión. Revisa tu email y contraseña.',
  [AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FIELDS_REQUIRED]:
    'Completa todos los campos.',
  [AUTH_PUBLIC_ERROR_CODES.PASSWORD_TOO_SHORT]:
    'La contraseña debe tener al menos 8 caracteres.',
  [AUTH_PUBLIC_ERROR_CODES.PASSWORD_MISMATCH]:
    'Las contraseñas no coinciden.',
  [AUTH_PUBLIC_ERROR_CODES.REGISTRATION_FAILED]:
    'No se pudo crear la cuenta. Inténtalo de nuevo.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_DISPLAY_NAME_REQUIRED]:
    'El nombre visible es obligatorio.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_DISPLAY_NAME_TOO_LONG]:
    'El nombre visible no puede superar los 120 caracteres.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_DJ_NAME_TOO_LONG]:
    'El nombre DJ no puede superar los 120 caracteres.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_BIO_TOO_LONG]:
    'La biografía no puede superar los 1000 caracteres.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_LANGUAGE_INVALID]:
    'El idioma seleccionado no es válido.',
  [AUTH_PUBLIC_ERROR_CODES.PROFILE_UPDATE_FAILED]:
    'No se pudo actualizar el perfil. Inténtalo de nuevo.',
  [AUTH_PUBLIC_ERROR_CODES.AUTH_CALLBACK_FAILED]:
    'No se pudo completar la autenticación. Inténtalo de nuevo.',
}

export type AuthPublicMessageCode =
  (typeof AUTH_PUBLIC_MESSAGE_CODES)[keyof typeof AUTH_PUBLIC_MESSAGE_CODES]

const AUTH_PUBLIC_MESSAGES: Record<AuthPublicMessageCode, string> = {
  [AUTH_PUBLIC_MESSAGE_CODES.ACCOUNT_CREATED]:
    'Cuenta creada. Revisa tu correo para confirmar el registro.',
  [AUTH_PUBLIC_MESSAGE_CODES.PROFILE_UPDATED]:
    'Perfil actualizado correctamente.',
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

export function isAuthPublicMessageCode(
  value: string | undefined
): value is AuthPublicMessageCode {
  return (
    value !== undefined &&
    Object.values(AUTH_PUBLIC_MESSAGE_CODES).includes(
      value as AuthPublicMessageCode
    )
  )
}

export function getAuthPublicMessage(
  code: string | undefined
): string | null {
  if (!code || !isAuthPublicMessageCode(code)) {
    return null
  }

  return AUTH_PUBLIC_MESSAGES[code]
}
