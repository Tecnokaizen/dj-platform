const DEFAULT_SAFE_INTERNAL_PATH = '/dashboard'

/**
 * Returns a same-origin relative path safe for post-auth redirects.
 * Rejects protocol-relative URLs, backslashes, schemes, and control/whitespace.
 */
export function getSafeInternalPath(
  value: unknown,
  fallback: string = DEFAULT_SAFE_INTERNAL_PATH
): string {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback
  }

  if (!value.startsWith('/')) {
    return fallback
  }

  if (value.startsWith('//')) {
    return fallback
  }

  if (value.includes('\\') || value.includes('://')) {
    return fallback
  }

  if (/[\0-\x1F\x7F\s]/.test(value)) {
    return fallback
  }

  return value
}
