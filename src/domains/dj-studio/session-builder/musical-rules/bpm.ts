/**
 * Soft BPM tolerance for curve fit and consecutive transitions (SPEC: ±3).
 * Exceeding tolerance is a warning, never an automatic hard fail.
 */
export const BPM_TOLERANCE_BPM = 3

function isUsableBpm(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Effective BPM precedence: LibraryItem.customBpm ?? Track.bpm.
 * Invalid / non-positive values are skipped so they never propagate.
 */
export function effectiveBpm(input: {
  customBpm: number | null
  trackBpm: number | null
}): number | null {
  if (isUsableBpm(input.customBpm)) {
    return input.customBpm
  }
  if (isUsableBpm(input.trackBpm)) {
    return input.trackBpm
  }
  return null
}

/**
 * Linear BPM target at a 0-based position along start→end.
 * When totalPositions === 1, returns startBpm.
 */
export function getTargetBpmAtPosition(input: {
  startBpm: number
  endBpm: number
  position: number
  totalPositions: number
}): number | null {
  const { startBpm, endBpm, position, totalPositions } = input

  if (
    !Number.isFinite(startBpm) ||
    !Number.isFinite(endBpm) ||
    !Number.isInteger(position) ||
    !Number.isInteger(totalPositions) ||
    totalPositions < 1 ||
    position < 0 ||
    position >= totalPositions
  ) {
    return null
  }

  if (totalPositions === 1 || startBpm === endBpm) {
    return startBpm
  }

  const t = position / (totalPositions - 1)
  return startBpm + (endBpm - startBpm) * t
}

export type BpmFitSeverity = 'ok' | 'warning' | 'unknown'

export type BpmFitResult = {
  delta: number | null
  withinTolerance: boolean | null
  severity: BpmFitSeverity
}

export function evaluateBpmFit(
  actual: number | null,
  target: number | null
): BpmFitResult {
  if (!isUsableBpm(actual) || !isUsableBpm(target)) {
    return {
      delta: null,
      withinTolerance: null,
      severity: 'unknown',
    }
  }

  const delta = actual - target
  const withinTolerance = Math.abs(delta) <= BPM_TOLERANCE_BPM

  return {
    delta,
    withinTolerance,
    severity: withinTolerance ? 'ok' : 'warning',
  }
}

export type BpmDirection = 'up' | 'down' | 'same' | 'unknown'

export type BpmTransitionResult = {
  delta: number | null
  absoluteDelta: number | null
  direction: BpmDirection
  exceedsTolerance: boolean
  severity: BpmFitSeverity
}

export function evaluateBpmTransition(
  from: number | null,
  to: number | null
): BpmTransitionResult {
  if (!isUsableBpm(from) || !isUsableBpm(to)) {
    return {
      delta: null,
      absoluteDelta: null,
      direction: 'unknown',
      exceedsTolerance: false,
      severity: 'unknown',
    }
  }

  const delta = to - from
  const absoluteDelta = Math.abs(delta)
  const direction: BpmDirection =
    delta > 0 ? 'up' : delta < 0 ? 'down' : 'same'
  const exceedsTolerance = absoluteDelta > BPM_TOLERANCE_BPM

  return {
    delta,
    absoluteDelta,
    direction,
    exceedsTolerance,
    severity: exceedsTolerance ? 'warning' : 'ok',
  }
}
