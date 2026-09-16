import type { CandidateSelectionBpmInput } from '@/domains/dj-studio/session-builder/types'

/**
 * Hard BPM window (min/max). start/end are NOT hard filters.
 * Null effective BPM is rejected when a window is present.
 */
export function passesHardBpmFilter(
  effectiveBpm: number | null,
  bpm: CandidateSelectionBpmInput | undefined,
): boolean {
  const hasMin = typeof bpm?.min === 'number' && Number.isFinite(bpm.min)
  const hasMax = typeof bpm?.max === 'number' && Number.isFinite(bpm.max)

  if (!hasMin && !hasMax) {
    return true
  }

  if (effectiveBpm === null) {
    return false
  }

  if (hasMin && effectiveBpm < (bpm!.min as number)) {
    return false
  }

  if (hasMax && effectiveBpm > (bpm!.max as number)) {
    return false
  }

  return true
}

/**
 * BPM soft component in [0, 1].
 * Envelope uses start/end when both present: score = max(0, 1 - distance/6).
 */
export function scoreBpmComponent(
  effectiveBpm: number | null,
  bpm: CandidateSelectionBpmInput | undefined,
): number {
  const hasStart = typeof bpm?.start === 'number' && Number.isFinite(bpm.start)
  const hasEnd = typeof bpm?.end === 'number' && Number.isFinite(bpm.end)
  const hasMin = typeof bpm?.min === 'number' && Number.isFinite(bpm.min)
  const hasMax = typeof bpm?.max === 'number' && Number.isFinite(bpm.max)

  if (hasStart && hasEnd) {
    if (effectiveBpm === null) {
      return 0.25
    }

    const low = Math.min(bpm!.start as number, bpm!.end as number)
    const high = Math.max(bpm!.start as number, bpm!.end as number)

    if (effectiveBpm >= low && effectiveBpm <= high) {
      return 1
    }

    const distance =
      effectiveBpm < low ? low - effectiveBpm : effectiveBpm - high

    return Math.max(0, 1 - distance / 6)
  }

  if (hasMin || hasMax) {
    // Already hard-filtered when window present.
    return 1
  }

  return 0.5
}
