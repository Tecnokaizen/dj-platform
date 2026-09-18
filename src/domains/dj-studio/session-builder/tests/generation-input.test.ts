import { describe, expect, it } from 'vitest'

import {
  parseSessionGenerationInput,
  toCandidateSelectionInput,
} from '@/domains/dj-studio/session-builder/generation'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    prompt: 'sunset afro house',
    targetDurationMin: 90,
    energyCurve: 'gradual_rise',
    source: 'library_only',
    ...overrides,
  }
}

describe('parseSessionGenerationInput', () => {
  it('accepts boundary durations and trackCountHint', () => {
    expect(
      parseSessionGenerationInput(validInput({ targetDurationMin: 15 })).targetDurationMin,
    ).toBe(15)
    expect(
      parseSessionGenerationInput(validInput({ targetDurationMin: 240 })).targetDurationMin,
    ).toBe(240)
    expect(
      parseSessionGenerationInput(validInput({ trackCountHint: 1 })).trackCountHint,
    ).toBe(1)
    expect(
      parseSessionGenerationInput(validInput({ trackCountHint: 60 })).trackCountHint,
    ).toBe(60)
  })

  it('rejects blank / oversized prompt', () => {
    for (const prompt of ['   ', 'x'.repeat(4001)]) {
      try {
        parseSessionGenerationInput(validInput({ prompt }))
        expect.unreachable('expected rejection')
      } catch (error) {
        expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
      }
    }
  })

  it('rejects invalid duration', () => {
    for (const targetDurationMin of [14, 241]) {
      try {
        parseSessionGenerationInput(validInput({ targetDurationMin }))
        expect.unreachable('expected rejection')
      } catch (error) {
        expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
      }
    }
  })

  it('rejects invalid BPM values and min > max', () => {
    for (const bpm of [
      { start: 0 },
      { start: -1 },
      { end: 401 },
      { min: Number.NaN },
      { max: Number.POSITIVE_INFINITY },
      { min: 130, max: 120 },
    ]) {
      try {
        parseSessionGenerationInput(validInput({ bpm }))
        expect.unreachable('expected rejection')
      } catch (error) {
        expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
      }
    }

    expect(
      parseSessionGenerationInput(
        validInput({ bpm: { start: 118, end: 123, min: 110, max: 130 } }),
      ).bpm,
    ).toEqual({ start: 118, end: 123, min: 110, max: 130 })
  })

  it('rejects invalid trackCountHint, energyCurve, and source', () => {
    for (const trackCountHint of [0, 61]) {
      try {
        parseSessionGenerationInput(validInput({ trackCountHint }))
        expect.unreachable('expected rejection')
      } catch (error) {
        expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
      }
    }

    try {
      parseSessionGenerationInput(validInput({ energyCurve: 'party' }))
      expect.unreachable('expected rejection')
    } catch (error) {
      expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
    }

    try {
      parseSessionGenerationInput(validInput({ source: 'catalog' }))
      expect.unreachable('expected rejection')
    } catch (error) {
      expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
    }
  })

  it('maps to P2 candidate input without targetDurationMin/source', () => {
    const input = parseSessionGenerationInput(
      validInput({
        trackCountHint: 3,
        bpm: { start: 118, end: 123 },
      }),
    )
    const mapped = toCandidateSelectionInput(input)
    expect(mapped).toEqual({
      prompt: 'sunset afro house',
      energyCurve: 'gradual_rise',
      bpm: { start: 118, end: 123 },
    })
    expect(mapped).not.toHaveProperty('targetDurationMin')
    expect(mapped).not.toHaveProperty('source')

    const withHint = toCandidateSelectionInput(
      parseSessionGenerationInput(validInput({ trackCountHint: 12 })),
    )
    expect(withHint.trackCountHint).toBe(12)
  })
})
