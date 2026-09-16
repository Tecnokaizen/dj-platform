import { describe, expect, it } from 'vitest'

import {
  BPM_TOLERANCE_BPM,
  effectiveBpm,
  evaluateBpmFit,
  evaluateBpmTransition,
  getTargetBpmAtPosition,
} from '@/domains/dj-studio/session-builder/musical-rules'

describe('effectiveBpm', () => {
  it('prefers customBpm over trackBpm', () => {
    expect(effectiveBpm({ customBpm: 121.5, trackBpm: 120 })).toBe(121.5)
  })

  it('falls back to trackBpm when customBpm is null', () => {
    expect(effectiveBpm({ customBpm: null, trackBpm: 120 })).toBe(120)
  })

  it('returns null when both are null', () => {
    expect(effectiveBpm({ customBpm: null, trackBpm: null })).toBeNull()
  })

  it('rejects non-finite and non-positive values', () => {
    expect(effectiveBpm({ customBpm: Number.NaN, trackBpm: 120 })).toBe(120)
    expect(effectiveBpm({ customBpm: 0, trackBpm: 120 })).toBe(120)
    expect(effectiveBpm({ customBpm: -10, trackBpm: null })).toBeNull()
    expect(
      effectiveBpm({ customBpm: Number.POSITIVE_INFINITY, trackBpm: 128 })
    ).toBe(128)
  })
})

describe('getTargetBpmAtPosition', () => {
  it('returns first and last of a 118→123 curve (0-based positions)', () => {
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 123,
        position: 0,
        totalPositions: 12,
      })
    ).toBe(118)
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 123,
        position: 11,
        totalPositions: 12,
      })
    ).toBe(123)
  })

  it('interpolates the middle linearly', () => {
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 123,
        position: 5,
        totalPositions: 11,
      })
    ).toBe(120.5)
  })

  it('stays constant when start equals end', () => {
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 118,
        position: 3,
        totalPositions: 8,
      })
    ).toBe(118)
  })

  it('returns null for invalid geometry', () => {
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 123,
        position: 0,
        totalPositions: 0,
      })
    ).toBeNull()
    expect(
      getTargetBpmAtPosition({
        startBpm: 118,
        endBpm: 123,
        position: 12,
        totalPositions: 12,
      })
    ).toBeNull()
  })
})

describe('evaluateBpmFit', () => {
  it(`uses soft tolerance of ±${BPM_TOLERANCE_BPM} BPM`, () => {
    const within = evaluateBpmFit(122.9, 120)
    expect(within.withinTolerance).toBe(true)
    expect(within.severity).toBe('ok')
    expect(within.delta).toBeCloseTo(2.9, 5)

    const outside = evaluateBpmFit(123.1, 120)
    expect(outside.withinTolerance).toBe(false)
    expect(outside.severity).toBe('warning')
    expect(outside.delta).toBeCloseTo(3.1, 5)
  })

  it('returns unknown when actual or target is null', () => {
    expect(evaluateBpmFit(null, 120)).toEqual({
      delta: null,
      withinTolerance: null,
      severity: 'unknown',
    })
    expect(evaluateBpmFit(120, null)).toEqual({
      delta: null,
      withinTolerance: null,
      severity: 'unknown',
    })
  })
})

describe('evaluateBpmTransition', () => {
  it('describes small and large jumps without hard-failing', () => {
    expect(evaluateBpmTransition(120, 121)).toEqual({
      delta: 1,
      absoluteDelta: 1,
      direction: 'up',
      exceedsTolerance: false,
      severity: 'ok',
    })
    expect(evaluateBpmTransition(120, 124)).toEqual({
      delta: 4,
      absoluteDelta: 4,
      direction: 'up',
      exceedsTolerance: true,
      severity: 'warning',
    })
    expect(evaluateBpmTransition(120, 118)).toEqual({
      delta: -2,
      absoluteDelta: 2,
      direction: 'down',
      exceedsTolerance: false,
      severity: 'ok',
    })
  })

  it('handles same and unknown cases', () => {
    expect(evaluateBpmTransition(120, 120).direction).toBe('same')
    expect(evaluateBpmTransition(null, 120)).toEqual({
      delta: null,
      absoluteDelta: null,
      direction: 'unknown',
      exceedsTolerance: false,
      severity: 'unknown',
    })
  })
})
