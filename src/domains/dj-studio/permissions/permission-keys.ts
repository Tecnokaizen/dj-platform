/**
 * DJ Studio Domain P0 permission keys.
 *
 * Registered by Domain seed extension when authorized — never by Core seed.
 * Shape mirrors Core `PERMISSION_KEYS` without extending Core's PermissionKey.
 */

export const DJ_STUDIO_PERMISSION_KEYS = {
  LIBRARY_READ: 'library.read',
  LIBRARY_MANAGE: 'library.manage',
  PLAYLISTS_READ: 'playlists.read',
  PLAYLISTS_MANAGE: 'playlists.manage',
} as const

export type DjStudioPermissionKey =
  (typeof DJ_STUDIO_PERMISSION_KEYS)[keyof typeof DJ_STUDIO_PERMISSION_KEYS]
