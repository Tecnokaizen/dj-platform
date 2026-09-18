/**
 * Deterministic lexical tag relevance against the generation prompt.
 * No fuzzy/semantic matching.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function hasTagPromptMatch(
  prompt: string,
  tagNames: Array<string | null | undefined>,
): boolean {
  const normalizedPrompt = normalizeSearchText(prompt)
  if (normalizedPrompt.length === 0) {
    return false
  }

  for (const tagName of tagNames) {
    if (typeof tagName !== 'string') {
      continue
    }
    const normalizedTag = normalizeSearchText(tagName)
    if (normalizedTag.length === 0) {
      continue
    }
    if (normalizedPrompt.includes(normalizedTag)) {
      return true
    }
  }

  return false
}

export function scoreTagRelevance(
  prompt: string,
  tagNames: Array<string | null | undefined>,
): number {
  return hasTagPromptMatch(prompt, tagNames) ? 1 : 0
}
