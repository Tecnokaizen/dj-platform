import { describe, expect, it } from 'vitest'

import {
  buildPlaylistReviewModel,
  formatSignedDelta,
  formatSourceBpm,
  mapCamelotCompatibilityToReviewRelation,
} from '@/app/(private)/playlists/playlist-review-presentation'

function track(input: {
  position: number
  title: string
  bpm: number | null
  camelotKey: string | null
  customKey?: string | null
  energy: number | null
  durationMs: number | null
  transitionNotes?: string | null
  artist?: string
}) {
  return {
    position: input.position,
    transitionNotes: input.transitionNotes ?? null,
    libraryItem: {
      energy: input.energy,
      customKey: input.customKey ?? null,
      track: {
        title: input.title,
        durationMs: input.durationMs,
        bpm: input.bpm,
        camelotKey: input.camelotKey,
        artists: [
          {
            creditedName: null,
            artist: { name: input.artist ?? 'Artist' },
          },
        ],
      },
    },
  }
}

describe('playlist review presentation', () => {
  it('maps Domain Camelot compatibility to review labels', () => {
    expect(mapCamelotCompatibilityToReviewRelation('exact')).toBe('SAME')
    expect(mapCamelotCompatibilityToReviewRelation('adjacent')).toBe('ADJACENT')
    expect(mapCamelotCompatibilityToReviewRelation('relative')).toBe('RELATIVE')
    expect(mapCamelotCompatibilityToReviewRelation('incompatible')).toBe('OTHER')
    expect(mapCamelotCompatibilityToReviewRelation('unknown')).toBe('MISSING')
  })

  it('formats signed deltas without inventing values', () => {
    expect(formatSignedDelta(null)).toBe('—')
    expect(formatSignedDelta(0)).toBe('0')
    expect(formatSignedDelta(2)).toBe('+2')
    expect(formatSignedDelta(-1.5)).toBe('-1.5')
  })

  it('preserves source BPM decimals', () => {
    expect(formatSourceBpm(118)).toBe('118')
    expect(formatSourceBpm(127.99)).toBe('127.99')
    expect(formatSourceBpm(null)).toBe('—')
  })

  it('builds dense review rows with presentation-only transitions', () => {
    const model = buildPlaylistReviewModel([
      track({
        position: 0,
        title: 'Chan Chan',
        bpm: 118,
        camelotKey: '7A',
        energy: 6,
        durationMs: 300_000,
        transitionNotes: null,
      }),
      track({
        position: 1,
        title: 'Next',
        bpm: 120,
        camelotKey: '8A',
        energy: 7,
        durationMs: 240_000,
        transitionNotes: 'Lift gently',
      }),
    ])

    expect(model.summary.trackCount).toBe(2)
    expect(model.summary.sourceBpmFirstLastLabel).toBe('118 → 120')
    expect(model.summary.bpmRangeLabel).toBe('118–120')
    expect(model.summary.energyRangeLabel).toBe('6–7')
    expect(model.summary.nominalDurationLabel).toBe('09:00')
    expect(model.summary.camelotTotals.ADJACENT).toBe(1)

    expect(model.rows[0]?.positionHuman).toBe(1)
    expect(model.rows[0]?.transitionInto).toBeNull()
    expect(model.rows[1]?.transitionInto).toEqual({
      bpmDelta: 2,
      energyDelta: 1,
      camelotRelation: 'ADJACENT',
    })
    expect(model.rows[1]?.transitionNotes).toBe('Lift gently')
  })

  it('uses effective Camelot precedence and dashes for missing metadata', () => {
    const model = buildPlaylistReviewModel([
      track({
        position: 0,
        title: 'A',
        bpm: null,
        camelotKey: '7A',
        customKey: '8A',
        energy: null,
        durationMs: null,
      }),
      track({
        position: 1,
        title: 'B',
        bpm: null,
        camelotKey: null,
        energy: null,
        durationMs: null,
      }),
    ])

    expect(model.rows[0]?.camelotLabel).toBe('8A')
    expect(model.rows[0]?.bpmLabel).toBe('—')
    expect(model.rows[0]?.energyLabel).toBe('—')
    expect(model.rows[0]?.durationLabel).toBe('—')
    expect(model.summary.nominalDurationLabel).toBe('—')
    expect(model.rows[1]?.transitionInto?.camelotRelation).toBe('MISSING')
  })
})
