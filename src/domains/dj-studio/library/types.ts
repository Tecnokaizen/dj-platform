/**
 * Music library ownership contracts.
 *
 * LibraryItem = Organization ↔ Track (tenant data).
 * Track itself remains shared catalog.
 * Tags are Organization-scoped and attach to LibraryItem.
 */

/** Minimal identity for an Organization library membership of a Track. */
export type LibraryItemRef = {
  organizationId: string
  trackId: string
  /** Actor who added the item; Organization remains owner. */
  addedByProfileId?: string | null
}

/** Organization-scoped tag identity (normalized uniqueness is org-local). */
export type TagRef = {
  organizationId: string
  normalizedName: string
}

/**
 * Join concept: Tag ↔ LibraryItem within the same Organization.
 * organizationId is denormalized on the join; composite tenant FKs are pending
 * (see Prisma M2 tenant-integrity note) before write runtime.
 */
export type LibraryItemTagRef = {
  organizationId: string
  libraryItemId: string
  tagId: string
}
