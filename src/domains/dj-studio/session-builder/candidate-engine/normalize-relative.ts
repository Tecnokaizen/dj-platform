/**
 * Min/max relative normalization within an eligible set.
 * Null values → 0. Equal known values → 0.5.
 */
export function normalizeRelative(
  value: number | null,
  minKnown: number | null,
  maxKnown: number | null,
): number {
  if (value === null || minKnown === null || maxKnown === null) {
    return 0
  }

  if (maxKnown === minKnown) {
    return 0.5
  }

  return (value - minKnown) / (maxKnown - minKnown)
}

export function knownMinMax(
  values: Array<number | null>,
): { min: number | null; max: number | null } {
  let min: number | null = null
  let max: number | null = null

  for (const value of values) {
    if (value === null || !Number.isFinite(value)) {
      continue
    }
    if (min === null || value < min) {
      min = value
    }
    if (max === null || value > max) {
      max = value
    }
  }

  return { min, max }
}
