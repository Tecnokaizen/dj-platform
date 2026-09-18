/**
 * Deterministic tag name normalization (org-local uniqueness uses this value).
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
