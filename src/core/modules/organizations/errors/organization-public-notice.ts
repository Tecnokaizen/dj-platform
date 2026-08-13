export const ORGANIZATION_PUBLIC_NOTICE_CODES = {
  UPDATED: 'organization_updated',
  INVALID_INPUT: 'organization_invalid_input',
  NOT_FOUND: 'organization_not_found',
  SLUG_CONFLICT: 'organization_slug_conflict',
  FORBIDDEN: 'organization_forbidden',
  UPDATE_FAILED: 'organization_update_failed',
} as const

const ORGANIZATION_PUBLIC_MESSAGES: Readonly<Record<string, string>> = {
  [ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATED]:
    'La organización se ha actualizado correctamente.',
}

const ORGANIZATION_PUBLIC_ERRORS: Readonly<Record<string, string>> = {
  [ORGANIZATION_PUBLIC_NOTICE_CODES.INVALID_INPUT]:
    'Revisa los datos de la organización.',
  [ORGANIZATION_PUBLIC_NOTICE_CODES.NOT_FOUND]:
    'No se ha encontrado la organización.',
  [ORGANIZATION_PUBLIC_NOTICE_CODES.SLUG_CONFLICT]:
    'Ese identificador de organización ya está en uso.',
  [ORGANIZATION_PUBLIC_NOTICE_CODES.FORBIDDEN]:
    'No tienes permiso para actualizar esta organización.',
  [ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATE_FAILED]:
    'No se ha podido actualizar la organización.',
}

export function getOrganizationPublicMessage(
  code: string | undefined
): string | null {
  return code ? ORGANIZATION_PUBLIC_MESSAGES[code] ?? null : null
}

export function getOrganizationPublicErrorMessage(
  code: string | undefined
): string | null {
  return code ? ORGANIZATION_PUBLIC_ERRORS[code] ?? null : null
}
