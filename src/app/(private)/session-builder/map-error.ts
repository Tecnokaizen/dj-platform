import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import {
  PLAYLIST_GENERATION_PROVIDER_ERROR_CODES,
  PlaylistGenerationProviderError,
} from '@/domains/dj-studio/session-builder/provider'

export const SESSION_BUILDER_PRODUCT_ERRORS = {
  VALIDATION: 'Revisa los datos de la sesión.',
  INSUFFICIENT_CANDIDATES:
    'No hay suficientes temas elegibles en tu biblioteca para generar una sesión. Necesitas al menos 8.',
  FORBIDDEN:
    'No tienes permisos para generar sesiones en esta organización.',
  PROVIDER_TIMEOUT: 'El generador ha tardado demasiado. Inténtalo de nuevo.',
  PROVIDER_UNAVAILABLE:
    'El generador no está disponible en este momento.',
  INVALID_PROPOSAL:
    'No se ha podido construir una propuesta válida. Inténtalo de nuevo.',
  GENERIC: 'No se ha podido completar la operación.',
} as const

/**
 * Map Domain / Provider errors to safe Product copy (no stacks / internals).
 */
export function mapSessionBuilderError(error: unknown): string {
  if (error instanceof DjStudioError) {
    switch (error.code) {
      case DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR:
        return SESSION_BUILDER_PRODUCT_ERRORS.VALIDATION
      case DJ_STUDIO_ERROR_CODES.INSUFFICIENT_SESSION_CANDIDATES:
        return SESSION_BUILDER_PRODUCT_ERRORS.INSUFFICIENT_CANDIDATES
      case DJ_STUDIO_ERROR_CODES.FORBIDDEN:
      case DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED:
        return SESSION_BUILDER_PRODUCT_ERRORS.FORBIDDEN
      default:
        return SESSION_BUILDER_PRODUCT_ERRORS.GENERIC
    }
  }

  if (error instanceof PlaylistGenerationProviderError) {
    switch (error.code) {
      case PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_TIMEOUT:
        return SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_TIMEOUT
      case PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.PROVIDER_UNAVAILABLE:
        return SESSION_BUILDER_PRODUCT_ERRORS.PROVIDER_UNAVAILABLE
      case PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE:
      case PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.INVALID_PROVIDER_PROPOSAL:
      case PLAYLIST_GENERATION_PROVIDER_ERROR_CODES.EMPTY_PROVIDER_PROPOSAL:
        return SESSION_BUILDER_PRODUCT_ERRORS.INVALID_PROPOSAL
      default:
        return SESSION_BUILDER_PRODUCT_ERRORS.GENERIC
    }
  }

  return SESSION_BUILDER_PRODUCT_ERRORS.GENERIC
}
