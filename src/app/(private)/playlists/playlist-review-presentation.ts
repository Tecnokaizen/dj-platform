/**
 * Product presentation helpers for Playlist human DJ review (P5).
 * Presentation-only — reuses Domain Camelot rules; no persistence.
 */

import {
  compareCamelot,
  effectiveCamelotKey,
  sumKnownDurations,
  type CamelotCompatibility,
} from '@/domains/dj-studio/session-builder/musical-rules'
import { formatArtistCredits } from '@/app/(private)/_lib/format-track'
import { formatDurationMs } from '@/app/(private)/session-builder/presentation'

export type PlaylistReviewCamelotRelation =
  | 'SAME'
  | 'ADJACENT'
  | 'RELATIVE'
  | 'OTHER'
  | 'MISSING'

export type PlaylistReviewTrackInput = {
  position: number
  transitionNotes: string | null
  libraryItem: {
    energy: number | null
    customKey: string | null
    track: {
      title: string
      durationMs: number | null
      bpm: { toString(): string } | number | null
      camelotKey: string | null
      artists: Array<{
        creditedName: string | null
        artist: { name: string }
      }>
    }
  }
}

export type PlaylistReviewTransition = {
  bpmDelta: number | null
  energyDelta: number | null
  camelotRelation: PlaylistReviewCamelotRelation
}

export type PlaylistReviewRow = {
  positionHuman: number
  title: string
  artist: string
  bpm: number | null
  bpmLabel: string
  camelot: string | null
  camelotLabel: string
  energy: number | null
  energyLabel: string
  durationMs: number | null
  durationLabel: string
  transitionNotes: string | null
  transitionInto: PlaylistReviewTransition | null
}

export type PlaylistReviewSummary = {
  trackCount: number
  nominalDurationLabel: string
  sourceBpmFirstLastLabel: string
  bpmRangeLabel: string
  energyRangeLabel: string
  camelotTotals: Record<PlaylistReviewCamelotRelation, number>
  camelotTotalsLabel: string
}

export type PlaylistReviewModel = {
  summary: PlaylistReviewSummary
  rows: PlaylistReviewRow[]
}

function toFiniteNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null
  }
  const numeric = typeof value === 'number' ? value : Number(value.toString())
  return Number.isFinite(numeric) ? numeric : null
}

/** Source BPM label — preserves known decimals; does not invent values. */
export function formatSourceBpm(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—'
  }
  if (Number.isInteger(value)) {
    return String(value)
  }
  return String(Number(value.toFixed(3)))
}

export function mapCamelotCompatibilityToReviewRelation(
  value: CamelotCompatibility,
): PlaylistReviewCamelotRelation {
  switch (value) {
    case 'exact':
      return 'SAME'
    case 'adjacent':
      return 'ADJACENT'
    case 'relative':
      return 'RELATIVE'
    case 'incompatible':
      return 'OTHER'
    case 'unknown':
      return 'MISSING'
  }
}

export function formatSignedDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }
  if (value === 0) {
    return '0'
  }
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return value > 0 ? `+${rounded}` : rounded
}

function emptyCamelotTotals(): Record<PlaylistReviewCamelotRelation, number> {
  return {
    SAME: 0,
    ADJACENT: 0,
    RELATIVE: 0,
    OTHER: 0,
    MISSING: 0,
  }
}

function formatRangeLabel(
  values: Array<number | null>,
  formatValue: (value: number) => string,
): string {
  const known = values.filter((value): value is number => value !== null)
  if (known.length === 0) {
    return '—'
  }
  const min = Math.min(...known)
  const max = Math.max(...known)
  if (min === max) {
    return formatValue(min)
  }
  return `${formatValue(min)}–${formatValue(max)}`
}

export function buildPlaylistReviewModel(
  items: PlaylistReviewTrackInput[],
): PlaylistReviewModel {
  const ordered = [...items].sort((a, b) => a.position - b.position)

  const resolved = ordered.map((item) => {
    const bpm = toFiniteNumber(item.libraryItem.track.bpm)
    const camelot = effectiveCamelotKey({
      customKey: item.libraryItem.customKey,
      camelotKey: item.libraryItem.track.camelotKey,
    })
    return {
      item,
      bpm,
      camelot,
      energy: item.libraryItem.energy,
      durationMs: item.libraryItem.track.durationMs,
    }
  })

  const camelotTotals = emptyCamelotTotals()
  const rows: PlaylistReviewRow[] = resolved.map((current, index) => {
    const previous = index > 0 ? resolved[index - 1] : null
    let transitionInto: PlaylistReviewTransition | null = null

    if (previous) {
      const camelotRelation = mapCamelotCompatibilityToReviewRelation(
        compareCamelot(previous.camelot, current.camelot),
      )
      camelotTotals[camelotRelation] += 1
      transitionInto = {
        bpmDelta:
          previous.bpm !== null && current.bpm !== null
            ? current.bpm - previous.bpm
            : null,
        energyDelta:
          previous.energy !== null && current.energy !== null
            ? current.energy - previous.energy
            : null,
        camelotRelation,
      }
    }

    return {
      positionHuman: current.item.position + 1,
      title: current.item.libraryItem.track.title,
      artist: formatArtistCredits(current.item.libraryItem.track.artists),
      bpm: current.bpm,
      bpmLabel: formatSourceBpm(current.bpm),
      camelot: current.camelot,
      camelotLabel: current.camelot ?? '—',
      energy: current.energy,
      energyLabel:
        current.energy === null || current.energy === undefined
          ? '—'
          : String(current.energy),
      durationMs: current.durationMs,
      durationLabel: formatDurationMs(current.durationMs),
      transitionNotes: current.item.transitionNotes,
      transitionInto,
    }
  })

  const bpms = resolved.map((entry) => entry.bpm)
  const energies = resolved.map((entry) => entry.energy)
  const durationAgg = sumKnownDurations(resolved.map((entry) => entry.durationMs))
  const firstBpm = bpms[0] ?? null
  const lastBpm = bpms.length > 0 ? bpms[bpms.length - 1]! : null

  const summary: PlaylistReviewSummary = {
    trackCount: rows.length,
    nominalDurationLabel:
      durationAgg.totalMs === null
        ? '—'
        : `${formatDurationMs(durationAgg.totalMs)}${
            durationAgg.mode === 'exact'
              ? ''
              : durationAgg.mode === 'approximate'
                ? ' (partial)'
                : ''
          }`,
    sourceBpmFirstLastLabel:
      firstBpm === null && lastBpm === null
        ? '—'
        : `${formatSourceBpm(firstBpm)} → ${formatSourceBpm(lastBpm)}`,
    bpmRangeLabel: formatRangeLabel(bpms, (value) => formatSourceBpm(value)),
    energyRangeLabel: formatRangeLabel(energies, (value) => String(value)),
    camelotTotals,
    camelotTotalsLabel: [
      `same ${camelotTotals.SAME}`,
      `adjacent ${camelotTotals.ADJACENT}`,
      `relative ${camelotTotals.RELATIVE}`,
      `other ${camelotTotals.OTHER}`,
      `missing ${camelotTotals.MISSING}`,
    ].join(' / '),
  }

  return { summary, rows }
}
