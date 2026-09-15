import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'

export const DJ_STUDIO_PUBLIC_NOTICE_CODES = {
  LIBRARY_ITEM_ADDED: 'library_item_added',
  LIBRARY_ITEM_UPDATED: 'library_item_updated',
  LIBRARY_ITEM_REMOVED: 'library_item_removed',
  TAG_CREATED: 'tag_created',
  TAG_ATTACHED: 'tag_attached',
  TAG_DETACHED: 'tag_detached',
  PLAYLIST_CREATED: 'playlist_created',
  PLAYLIST_UPDATED: 'playlist_updated',
  PLAYLIST_DELETED: 'playlist_deleted',
  PLAYLIST_ITEM_ADDED: 'playlist_item_added',
  PLAYLIST_ITEM_UPDATED: 'playlist_item_updated',
  PLAYLIST_ITEM_REMOVED: 'playlist_item_removed',
  PLAYLIST_REORDERED: 'playlist_reordered',
  STUDIO_PROFILE_SAVED: 'studio_profile_saved',
  ORGANIZATION_SWITCHED: 'organization_switched',
  INVALID_INPUT: 'dj_studio_invalid_input',
  FORBIDDEN: 'dj_studio_forbidden',
  TRACK_NOT_FOUND: 'dj_studio_track_not_found',
  LIBRARY_ITEM_NOT_FOUND: 'dj_studio_library_item_not_found',
  LIBRARY_ITEM_IN_USE: 'dj_studio_library_item_in_use',
  PLAYLIST_NOT_FOUND: 'dj_studio_playlist_not_found',
  TAG_NOT_FOUND: 'dj_studio_tag_not_found',
  TAG_NAME_CONFLICT: 'dj_studio_tag_name_conflict',
  VALIDATION_ERROR: 'dj_studio_validation_error',
  UPDATE_FAILED: 'dj_studio_update_failed',
} as const

const SUCCESS_MESSAGES: Readonly<Record<string, string>> = {
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_ADDED]:
    'Track añadido a la biblioteca.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_UPDATED]:
    'Elemento de biblioteca actualizado.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_REMOVED]:
    'Elemento eliminado de la biblioteca.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_CREATED]: 'Tag creado.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_ATTACHED]: 'Tag añadido.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_DETACHED]: 'Tag eliminado del elemento.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_CREATED]: 'Playlist creada.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_UPDATED]: 'Playlist actualizada.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_DELETED]: 'Playlist eliminada.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_ADDED]:
    'Elemento añadido a la playlist.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_UPDATED]:
    'Elemento de playlist actualizado.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_ITEM_REMOVED]:
    'Elemento eliminado de la playlist.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_REORDERED]: 'Orden actualizado.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.STUDIO_PROFILE_SAVED]:
    'Perfil de estudio guardado.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.ORGANIZATION_SWITCHED]:
    'Organización activa actualizada.',
}

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.INVALID_INPUT]:
    'Revisa los datos del formulario.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.FORBIDDEN]:
    'No tienes permiso para realizar esta acción.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TRACK_NOT_FOUND]:
    'El track ya no está disponible en el catálogo.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_NOT_FOUND]:
    'No se ha encontrado el elemento de biblioteca.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_IN_USE]:
    'No se puede eliminar: el elemento está en una o más playlists.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_NOT_FOUND]:
    'No se ha encontrado la playlist.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_NOT_FOUND]: 'No se ha encontrado el tag.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_NAME_CONFLICT]:
    'Ya existe un tag con ese nombre en esta organización.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR]:
    'Los datos no son válidos.',
  [DJ_STUDIO_PUBLIC_NOTICE_CODES.UPDATE_FAILED]:
    'No se ha podido completar la operación.',
}

export function getDjStudioPublicMessage(
  code: string | undefined,
): string | null {
  return code ? (SUCCESS_MESSAGES[code] ?? null) : null
}

export function getDjStudioPublicErrorMessage(
  code: string | undefined,
): string | null {
  return code ? (ERROR_MESSAGES[code] ?? null) : null
}

export function mapDjStudioErrorToPublicNotice(code: string): string {
  switch (code) {
    case DJ_STUDIO_ERROR_CODES.FORBIDDEN:
    case DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.FORBIDDEN
    case DJ_STUDIO_ERROR_CODES.TRACK_NOT_FOUND:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.TRACK_NOT_FOUND
    case DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_NOT_FOUND:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_NOT_FOUND
    case DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_IN_USE:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_IN_USE
    case DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.PLAYLIST_NOT_FOUND
    case DJ_STUDIO_ERROR_CODES.TAG_NOT_FOUND:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_NOT_FOUND
    case DJ_STUDIO_ERROR_CODES.TAG_NAME_CONFLICT:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.TAG_NAME_CONFLICT
    case DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.VALIDATION_ERROR
    default:
      return DJ_STUDIO_PUBLIC_NOTICE_CODES.UPDATE_FAILED
  }
}
