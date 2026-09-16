import { describe, expect, it } from 'vitest'

import { mapSessionBuilderFormData } from '@/app/(private)/session-builder/map-form-data'
import { parseSessionGenerationInput } from '@/domains/dj-studio/session-builder/generation'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value)
  }
  return data
}

function expectDomainReject(raw: unknown) {
  try {
    parseSessionGenerationInput(raw)
    expect.unreachable('expected Domain VALIDATION_ERROR')
  } catch (error) {
    expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
  }
}

describe('mapSessionBuilderFormData', () => {
  it('maps a valid form and forces library_only source', () => {
    const mapped = mapSessionBuilderFormData(
      form({
        prompt: '  sunset set  ',
        targetDurationMin: '90',
        energyCurve: 'warm_peak',
        bpmStart: '118',
        bpmEnd: '123',
        bpmMin: '110',
        bpmMax: '130',
        trackCountHint: '12',
        source: 'catalog_hack',
        organizationId: 'should-not-appear',
      }),
    )

    expect(mapped).toEqual({
      prompt: 'sunset set',
      targetDurationMin: 90,
      energyCurve: 'warm_peak',
      bpm: { start: 118, end: 123, min: 110, max: 130 },
      trackCountHint: 12,
      source: 'library_only',
    })
    expect(mapped).not.toHaveProperty('organizationId')
    expect(parseSessionGenerationInput(mapped).source).toBe('library_only')
  })

  it('omits blank optional BPM and trackCountHint as undefined', () => {
    const mapped = mapSessionBuilderFormData(
      form({
        prompt: 'sunset',
        targetDurationMin: '60',
        energyCurve: 'steady',
        bpmStart: '',
        bpmEnd: '',
        bpmMin: '',
        bpmMax: '',
        trackCountHint: '',
      }),
    )

    expect(mapped.bpm).toBeUndefined()
    expect(mapped.trackCountHint).toBeUndefined()
    expect(mapped.source).toBe('library_only')
  })

  it('preserves invalid coerced numbers for Domain rejection', () => {
    expect(mapSessionBuilderFormData(form({
      prompt: 'set',
      targetDurationMin: '90',
      energyCurve: 'gradual_rise',
      bpmStart: '',
    })).bpm).toBeUndefined()

    const bpm999 = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'gradual_rise',
        bpmStart: '999',
      }),
    )
    expect(bpm999.bpm).toEqual({ start: 999 })
    expectDomainReject(bpm999)

    const bpmNeg = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'gradual_rise',
        bpmStart: '-4',
      }),
    )
    expect(bpmNeg.bpm).toEqual({ start: -4 })
    expectDomainReject(bpmNeg)

    const bpmAbc = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'gradual_rise',
        bpmStart: 'abc',
      }),
    )
    expect(Number.isNaN(bpmAbc.bpm?.start)).toBe(true)
    expectDomainReject(bpmAbc)

    const hint61 = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'gradual_rise',
        trackCountHint: '61',
      }),
    )
    expect(hint61.trackCountHint).toBe(61)
    expectDomainReject(hint61)

    const hintFloat = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'gradual_rise',
        trackCountHint: '2.5',
      }),
    )
    expect(hintFloat.trackCountHint).toBe(2.5)
    expectDomainReject(hintFloat)

    const energyHacked = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'hacked',
      }),
    )
    expect(energyHacked.energyCurve).toBe('hacked')
    expectDomainReject(energyHacked)

    const duration999 = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '999',
        energyCurve: 'gradual_rise',
      }),
    )
    expect(duration999.targetDurationMin).toBe(999)
    expectDomainReject(duration999)
  })

  it('forces source library_only even when client sends another value', () => {
    const mapped = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '90',
        energyCurve: 'steady',
        source: 'anything',
      }),
    )
    expect(mapped.source).toBe('library_only')
  })
})
