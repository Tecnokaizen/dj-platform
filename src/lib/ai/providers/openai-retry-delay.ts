export const DEFAULT_RETRY_FALLBACK_MS = 500
export const MAX_RETRY_DELAY_MS = 5_000

/**
 * Resolve adapter retry delay from Retry-After (seconds or HTTP-date).
 * Caps at MAX_RETRY_DELAY_MS. Deterministic fallback when header missing/invalid.
 */
export function resolveRetryDelayMs(
  headers: Headers | null | undefined,
  options?: {
    fallbackMs?: number
    maxMs?: number
    nowMs?: number
  },
): number {
  const maxMs = options?.maxMs ?? MAX_RETRY_DELAY_MS
  const fallbackMs = Math.min(options?.fallbackMs ?? DEFAULT_RETRY_FALLBACK_MS, maxMs)
  const raw = headers?.get('retry-after')?.trim()

  if (!raw) {
    return fallbackMs
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const seconds = Number(raw)
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.ceil(seconds * 1000), maxMs)
    }
  }

  const dateMs = Date.parse(raw)
  if (!Number.isNaN(dateMs)) {
    const nowMs = options?.nowMs ?? Date.now()
    return Math.min(Math.max(0, dateMs - nowMs), maxMs)
  }

  return fallbackMs
}
