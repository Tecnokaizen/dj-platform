/**
 * Session Builder visibility for Library tags.
 *
 * Import/provenance markers stay in DB for importer/rollback, but must not
 * enter candidate scoring, shortlist, or provider payload.
 *
 * Prefix match only (not substring): a user tag containing the word "import"
 * elsewhere remains visible.
 */

export const SESSION_BUILDER_EXCLUDED_TAG_PREFIXES = [
  'import:',
  'import-created:',
] as const

export type SessionBuilderTagNameInput = {
  name: string
  normalizedName?: string | null
}

function matchesExcludedPrefix(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return SESSION_BUILDER_EXCLUDED_TAG_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  )
}

/**
 * Returns true when a tag may participate in Session Builder musical context.
 */
export function isSessionBuilderVisibleTag(
  tag: SessionBuilderTagNameInput,
): boolean {
  const candidates = [tag.normalizedName, tag.name].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  )

  if (candidates.length === 0) {
    return false
  }

  return !candidates.some((value) => matchesExcludedPrefix(value))
}
