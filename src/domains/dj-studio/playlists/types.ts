/**
 * Playlist contracts.
 *
 * Invariant (DJ-STUDIO-001): PlaylistItem references LibraryItem,
 * never Track directly.
 */

export type PlaylistRef = {
  organizationId: string
  id: string
}

export type PlaylistItemRef = {
  organizationId: string
  playlistId: string
  /** Required: item points at library membership, not catalog Track. */
  libraryItemId: string
  position: number
  addedByProfileId?: string | null
}
