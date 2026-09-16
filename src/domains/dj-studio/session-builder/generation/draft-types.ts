import type {
  BpmProgressionShape,
  DurationAggregationMode,
} from '@/domains/dj-studio/session-builder/musical-rules'
import type { PlaylistGenerationWarning } from '@/domains/dj-studio/session-builder/provider'

export type SessionBuilderDraftWarning = PlaylistGenerationWarning

export type SessionBuilderDraftTrack = {
  libraryItemId: string
  position: number
  title: string
  artists: string[]
  bpmEffective: number | null
  camelotEffective: string | null
  energy: number | null
  durationMs: number | null
  estimatedStartMs: number | null
  transitionNote: string | null
  reason: string
}

export type SessionBuilderDraftBpmProgression = {
  start: number | null
  end: number | null
  classification: BpmProgressionShape
  notes: string | null
}

/**
 * Ephemeral Product draft after P4 orchestration.
 * Domain metadata is authoritative; Provider contributes narrative fields only.
 */
export type SessionBuilderDraft = {
  title: string
  summary: string
  targetDurationMin: number
  estimatedDurationMs: number | null
  estimatedDurationMode: DurationAggregationMode
  bpmProgression: SessionBuilderDraftBpmProgression
  energyProgression: string
  tracks: SessionBuilderDraftTrack[]
  warnings: SessionBuilderDraftWarning[]
}
