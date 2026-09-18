import { describe, expect, it } from 'vitest'

import {
  analyzeBpmProgression,
  sumKnownDurations,
} from '@/domains/dj-studio/session-builder/musical-rules'

describe('analyzeBpmProgression', () => {
  it('classifies ascending sequences', () => {
    const result = analyzeBpmProgression([118, 119, 121, 123])
    expect(result).toMatchObject({
      knownCount: 4,
      totalCount: 4,
      start: 118,
      end: 123,
      directionChanges: 0,
      largeJumps: 0,
      shape: 'ascending',
    })
  })

  it('classifies descending sequences', () => {
    expect(analyzeBpmProgression([128, 126, 124, 120]).shape).toBe(
      'descending'
    )
  })

  it('classifies steady sequences', () => {
    expect(analyzeBpmProgression([120, 120, 120]).shape).toBe('steady')
  })

  it('detects zig-zag / mixed sequences with direction changes and large jumps', () => {
    const result = analyzeBpmProgression([118, 122, 119, 123, 118])
    expect(result.shape).toBe('mixed')
    expect(result.directionChanges).toBeGreaterThan(0)
    expect(result.largeJumps).toBeGreaterThan(0)
  })

  it('returns insufficient_data for single value or all null', () => {
    expect(analyzeBpmProgression([120]).shape).toBe('insufficient_data')
    expect(analyzeBpmProgression([null, null]).shape).toBe(
      'insufficient_data'
    )
  })

  it('ignores nulls when analyzing known neighbors', () => {
    const result = analyzeBpmProgression([118, null, 120, null, 122])
    expect(result.knownCount).toBe(3)
    expect(result.shape).toBe('ascending')
  })
})

describe('sumKnownDurations', () => {
  it('marks exact when every duration is known', () => {
    expect(sumKnownDurations([180_000, 240_000])).toEqual({
      totalMs: 420_000,
      knownCount: 2,
      totalCount: 2,
      mode: 'exact',
    })
  })

  it('marks approximate when some durations are known (no missing-value invent)', () => {
    expect(sumKnownDurations([180_000, null, 240_000])).toEqual({
      totalMs: 420_000,
      knownCount: 2,
      totalCount: 3,
      mode: 'approximate',
    })
  })

  it('marks unknown when none are known, including empty', () => {
    expect(sumKnownDurations([null, null])).toEqual({
      totalMs: null,
      knownCount: 0,
      totalCount: 2,
      mode: 'unknown',
    })
    expect(sumKnownDurations([])).toEqual({
      totalMs: null,
      knownCount: 0,
      totalCount: 0,
      mode: 'unknown',
    })
  })
})
