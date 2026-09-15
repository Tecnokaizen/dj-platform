import { BPM_TOLERANCE_BPM, evaluateBpmTransition } from './bpm'

export type BpmProgressionShape =
  | 'ascending'
  | 'descending'
  | 'steady'
  | 'mixed'
  | 'insufficient_data'

export type BpmProgressionAnalysis = {
  knownCount: number
  totalCount: number
  start: number | null
  end: number | null
  directionChanges: number
  largeJumps: number
  shape: BpmProgressionShape
}

function isKnownBpm(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Lightweight BPM sequence analysis for zig-zag / monotonicity warnings.
 * Nulls are skipped; no musical theory beyond consecutive deltas.
 */
export function analyzeBpmProgression(
  bpms: Array<number | null>
): BpmProgressionAnalysis {
  const known = bpms.filter(isKnownBpm)
  const knownCount = known.length
  const totalCount = bpms.length

  if (knownCount < 2) {
    return {
      knownCount,
      totalCount,
      start: known[0] ?? null,
      end: known[0] ?? null,
      directionChanges: 0,
      largeJumps: 0,
      shape: 'insufficient_data',
    }
  }

  let directionChanges = 0
  let largeJumps = 0
  let previousNonZero: -1 | 1 | null = null

  for (let index = 1; index < known.length; index += 1) {
    const transition = evaluateBpmTransition(known[index - 1], known[index])
    if (
      transition.absoluteDelta !== null &&
      transition.absoluteDelta > BPM_TOLERANCE_BPM
    ) {
      largeJumps += 1
    }

    const signed: -1 | 0 | 1 =
      transition.direction === 'up'
        ? 1
        : transition.direction === 'down'
          ? -1
          : 0

    if (
      previousNonZero !== null &&
      signed !== 0 &&
      signed !== previousNonZero
    ) {
      directionChanges += 1
    }

    if (signed === 1 || signed === -1) {
      previousNonZero = signed
    }
  }

  const start = known[0]
  const end = known[known.length - 1]
  let shape: BpmProgressionShape

  if (directionChanges > 0) {
    shape = 'mixed'
  } else if (end > start) {
    shape = 'ascending'
  } else if (end < start) {
    shape = 'descending'
  } else {
    shape = 'steady'
  }

  return {
    knownCount,
    totalCount,
    start,
    end,
    directionChanges,
    largeJumps,
    shape,
  }
}

export type DurationAggregationMode = 'exact' | 'approximate' | 'unknown'

export type DurationAggregation = {
  totalMs: number | null
  knownCount: number
  totalCount: number
  mode: DurationAggregationMode
}

/**
 * Sum known durations only. P1 never invents missing track lengths.
 * Mode maps to proposal `estimatedDurationMode` vocabulary:
 * all known → exact; some known → approximate; none → unknown.
 */
export function sumKnownDurations(
  durationMs: Array<number | null | undefined>
): DurationAggregation {
  const totalCount = durationMs.length
  let knownCount = 0
  let totalMs = 0

  for (const value of durationMs) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      knownCount += 1
      totalMs += value
    }
  }

  if (knownCount === 0) {
    return {
      totalMs: null,
      knownCount: 0,
      totalCount,
      mode: 'unknown',
    }
  }

  if (knownCount === totalCount) {
    return {
      totalMs,
      knownCount,
      totalCount,
      mode: 'exact',
    }
  }

  return {
    totalMs,
    knownCount,
    totalCount,
    mode: 'approximate',
  }
}
