import { describe, expect, it } from 'vitest'

import { mapSessionBuilderFormData } from '@/app/(private)/session-builder/map-form-data'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value)
  }
  return data
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

  it('converts FormData numeric strings and rejects zero BPM/hint', () => {
    const mapped = mapSessionBuilderFormData(
      form({
        prompt: 'set',
        targetDurationMin: '45',
        energyCurve: 'gradual_rise',
        bpmStart: '0',
        bpmEnd: '120',
        trackCountHint: '0',
      }),
    )

    expect(mapped.targetDurationMin).toBe(45)
    expect(mapped.bpm).toEqual({ end: 120 })
    expect(mapped.trackCountHint).toBeUndefined()
  })
})
