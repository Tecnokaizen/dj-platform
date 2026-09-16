import { describe, expect, it } from 'vitest'

import {
  passesHardBpmFilter,
  scoreBpmComponent,
} from '@/domains/dj-studio/session-builder/candidate-engine/bpm-score'
import {
  knownMinMax,
  normalizeRelative,
} from '@/domains/dj-studio/session-builder/candidate-engine/normalize-relative'
import {
  buildRelativeNormalizationRanges,
  scoreSessionCandidate,
} from '@/domains/dj-studio/session-builder/candidate-engine/score-candidate'
import { scoreTagRelevance } from '@/domains/dj-studio/session-builder/candidate-engine/tag-relevance'
import type {
  CandidateSelectionInput,
  SessionCandidateSource,
} from '@/domains/dj-studio/session-builder/types'

const baseInput: CandidateSelectionInput = {
  prompt: 'sunset afro house elegante',
  energyCurve: 'gradual_rise',
}

function source(
  overrides: Partial<SessionCandidateSource> & { libraryItemId: string },
): SessionCandidateSource {
  return {
    trackId: `track-${overrides.libraryItemId}`,
    title: `Title ${overrides.libraryItemId}`,
    artists: [],
    effectiveBpm: 120,
    effectiveCamelotKey: '8A',
    durationMs: 180_000,
    energy: 3,
    rating: 3,
    familiarity: 3,
    isFavorite: false,
    tags: [],
    ...overrides,
  }
}

describe('scoreBpmComponent', () => {
  it('scores inside / outside envelope with distance / 6 decay', () => {
    const bpm = { start: 118, end: 123 }
    expect(scoreBpmComponent(121, bpm)).toBe(1)
    expect(scoreBpmComponent(124.5, bpm)).toBeCloseTo(0.75, 5)
    expect(scoreBpmComponent(126, bpm)).toBeCloseTo(0.5, 5)
    expect(scoreBpmComponent(129, bpm)).toBe(0)
    expect(scoreBpmComponent(null, bpm)).toBe(0.25)
  })

  it('uses neutral 0.5 without start/end/min/max and 1.0 after min/max filter', () => {
    expect(scoreBpmComponent(140, undefined)).toBe(0.5)
    expect(scoreBpmComponent(120, { min: 118, max: 123 })).toBe(1)
  })
})

describe('passesHardBpmFilter', () => {
  it('enforces min/max and rejects null when window present', () => {
    const window = { min: 118, max: 123 }
    expect(passesHardBpmFilter(117, window)).toBe(false)
    expect(passesHardBpmFilter(118, window)).toBe(true)
    expect(passesHardBpmFilter(123, window)).toBe(true)
    expect(passesHardBpmFilter(124, window)).toBe(false)
    expect(passesHardBpmFilter(null, window)).toBe(false)
  })

  it('does not hard-filter on start/end alone', () => {
    expect(passesHardBpmFilter(130, { start: 118, end: 123 })).toBe(true)
    expect(passesHardBpmFilter(null, { start: 118, end: 123 })).toBe(true)
  })
})

describe('relative normalization', () => {
  it('normalizes rating and familiarity with null/equal handling', () => {
    const { min, max } = knownMinMax([1, 5, null, 3])
    expect(normalizeRelative(1, min, max)).toBe(0)
    expect(normalizeRelative(5, min, max)).toBe(1)
    expect(normalizeRelative(3, min, max)).toBe(0.5)
    expect(normalizeRelative(null, min, max)).toBe(0)

    const equal = knownMinMax([4, 4, null])
    expect(normalizeRelative(4, equal.min, equal.max)).toBe(0.5)
  })
})

describe('favorite / tags / energy / camelot components via scoreSessionCandidate', () => {
  it('computes deterministic weighted breakdown', () => {
    const candidates = [
      source({
        libraryItemId: 'a',
        rating: 1,
        familiarity: 1,
        energy: null,
        effectiveCamelotKey: null,
        isFavorite: false,
        tags: [],
      }),
      source({
        libraryItemId: 'b',
        rating: 5,
        familiarity: 5,
        energy: 2,
        effectiveCamelotKey: '8A',
        isFavorite: true,
        tags: [
          {
            id: 't1',
            name: 'Afro House',
            normalizedName: 'afro house',
          },
        ],
      }),
    ]
    const ranges = buildRelativeNormalizationRanges(candidates)
    const scored = scoreSessionCandidate(candidates[1], baseInput, ranges)

    expect(scoreTagRelevance(baseInput.prompt, ['afro house'])).toBe(1)
    expect(scoreTagRelevance(baseInput.prompt, ['techno'])).toBe(0)
    expect(scored.scoreBreakdown.favorite).toBe(10)
    expect(scored.scoreBreakdown.tags).toBe(15)
    expect(scored.scoreBreakdown.energy).toBe(10)
    expect(scored.scoreBreakdown.camelot).toBe(5)
    expect(scored.scoreBreakdown.rating).toBe(15)
    expect(scored.scoreBreakdown.familiarity).toBe(10)
    expect(scored.score).toBeCloseTo(
      scored.scoreBreakdown.bpm +
        scored.scoreBreakdown.rating +
        scored.scoreBreakdown.familiarity +
        scored.scoreBreakdown.favorite +
        scored.scoreBreakdown.tags +
        scored.scoreBreakdown.energy +
        scored.scoreBreakdown.camelot,
      8,
    )
  })
})
