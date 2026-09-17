import { compareCamelot } from '@/domains/dj-studio/session-builder/musical-rules'
import { evaluateBpmTransition } from '@/domains/dj-studio/session-builder/musical-rules'
import type { DurationAggregation } from '@/domains/dj-studio/session-builder/musical-rules'
import type { SessionBuilderDraftTrack } from '@/domains/dj-studio/session-builder/generation/draft-types'
import type { SessionBuilderDraftWarning } from '@/domains/dj-studio/session-builder/generation/draft-types'
import type { PlaylistGenerationWarning } from '@/domains/dj-studio/session-builder/provider'

function formatBpmDelta(absoluteDelta: number): string {
  return Number.isInteger(absoluteDelta)
    ? String(absoluteDelta)
    : absoluteDelta.toFixed(1)
}

/**
 * Deterministic Domain warnings for a validated track sequence.
 */
export function buildDomainDraftWarnings(
  tracks: SessionBuilderDraftTrack[],
  duration: DurationAggregation,
): SessionBuilderDraftWarning[] {
  const warnings: SessionBuilderDraftWarning[] = []

  for (let index = 1; index < tracks.length; index += 1) {
    const previous = tracks[index - 1]
    const current = tracks[index]
    const transition = evaluateBpmTransition(
      previous.bpmEffective,
      current.bpmEffective,
    )

    if (
      transition.exceedsTolerance &&
      transition.absoluteDelta !== null
    ) {
      warnings.push({
        code: 'BPM_LARGE_JUMP',
        message: `Salto de ${formatBpmDelta(transition.absoluteDelta)} BPM entre ${previous.title} y ${current.title}.`,
        severity: 'warning',
      })
    }

    const camelot = compareCamelot(
      previous.camelotEffective,
      current.camelotEffective,
    )
    if (camelot === 'incompatible') {
      warnings.push({
        code: 'CAMELOT_INCOMPATIBLE',
        message: `Camelot incompatible entre ${previous.title} y ${current.title}.`,
        severity: 'warning',
      })
    }
  }

  const missingBpm = tracks.filter((track) => track.bpmEffective === null).length
  if (missingBpm > 0) {
    warnings.push({
      code: 'MISSING_BPM_METADATA',
      message: `${missingBpm} tracks no tienen BPM disponible.`,
      severity: 'info',
    })
  }

  const missingCamelot = tracks.filter(
    (track) => track.camelotEffective === null,
  ).length
  if (missingCamelot > 0) {
    warnings.push({
      code: 'MISSING_CAMELOT_METADATA',
      message: `${missingCamelot} tracks no tienen Camelot disponible.`,
      severity: 'info',
    })
  }

  const missingEnergy = tracks.filter((track) => track.energy === null).length
  if (missingEnergy > 0) {
    warnings.push({
      code: 'ENERGY_METADATA_INCOMPLETE',
      message: `${missingEnergy} tracks no tienen energía disponible.`,
      severity: 'info',
    })
  }

  if (duration.mode === 'approximate') {
    warnings.push({
      code: 'DURATION_METADATA_PARTIAL',
      message:
        'La duración estimada no representa necesariamente la duración total exacta.',
      severity: 'warning',
    })
  }

  if (duration.mode === 'unknown') {
    warnings.push({
      code: 'DURATION_METADATA_UNKNOWN',
      message: 'No hay duraciones conocidas para estimar la sesión.',
      severity: 'warning',
    })
  }

  return warnings
}

/**
 * Domain warnings first, then Provider warnings.
 * Deduplicate only on exact code + message equality.
 */
export function mergeDraftWarnings(
  domainWarnings: SessionBuilderDraftWarning[],
  providerWarnings: PlaylistGenerationWarning[],
): SessionBuilderDraftWarning[] {
  const merged: SessionBuilderDraftWarning[] = []
  const seen = new Set<string>()

  for (const warning of [...domainWarnings, ...providerWarnings]) {
    const key = `${warning.code}\0${warning.message}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    merged.push(warning)
  }

  return merged
}
