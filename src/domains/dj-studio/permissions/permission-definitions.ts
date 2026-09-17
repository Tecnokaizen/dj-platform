import {
  DJ_STUDIO_PERMISSION_KEYS,
  type DjStudioPermissionKey,
} from '@/domains/dj-studio/permissions/permission-keys'

/**
 * Domain permission catalog metadata for a future Domain seed extension.
 * Owner is never Platform Core.
 */
export type DjStudioPermissionDefinition = {
  key: DjStudioPermissionKey
  name: string
  description: string
  owner: 'DJ Studio Domain'
}

export const DJ_STUDIO_PERMISSION_DEFINITIONS: readonly DjStudioPermissionDefinition[] =
  [
    {
      key: DJ_STUDIO_PERMISSION_KEYS.LIBRARY_READ,
      name: 'Read library',
      description: 'Read Organization music library items and tags.',
      owner: 'DJ Studio Domain',
    },
    {
      key: DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
      name: 'Manage library',
      description: 'Add, update, and remove Organization library items and tags.',
      owner: 'DJ Studio Domain',
    },
    {
      key: DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_READ,
      name: 'Read playlists',
      description: 'Read Organization playlists and playlist items.',
      owner: 'DJ Studio Domain',
    },
    {
      key: DJ_STUDIO_PERMISSION_KEYS.PLAYLISTS_MANAGE,
      name: 'Manage playlists',
      description: 'Create, update, and delete Organization playlists and items.',
      owner: 'DJ Studio Domain',
    },
  ]
