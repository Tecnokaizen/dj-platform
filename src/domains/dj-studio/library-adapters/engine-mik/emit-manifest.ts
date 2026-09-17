import { createHash } from 'node:crypto'

import { ENGINE_MIK_EXTERNAL_SOURCE } from '@/domains/dj-studio/library-adapters/engine-mik/constants'
import type { AdapterMatch } from '@/domains/dj-studio/library-adapters/engine-mik/types'
import {
  ALL_MANIFEST_COLUMNS,
  MANIFEST_GENRE_TAG_SEPARATOR,
} from '@/domains/dj-studio/library-import/constants'
import { normalizeMatchKey } from '@/domains/dj-studio/library-import/normalize-manifest-row'

export function buildExternalId(input: {
  artist: string
  title: string
  durationMs: number | null
}): string {
  const payload = [
    normalizeMatchKey(input.artist),
    normalizeMatchKey(input.title),
    input.durationMs === null ? '' : String(input.durationMs),
  ].join('\u0000')
  const digest = createHash('sha256').update(payload, 'utf8').digest('hex')
  return `emk-${digest.slice(0, 24)}`
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export type EmitManifestOptions = {
  batchId: string
  /** Explicit operator tags applied to every row (pipe-separated). */
  operatorTags?: string[]
}

/**
 * Emit dj-studio-library-manifest.v1.csv from joined Engine+MIK matches.
 * Never includes filesystem paths.
 */
export function emitCanonicalManifestCsv(
  matches: AdapterMatch[],
  options: EmitManifestOptions,
): string {
  const header = ALL_MANIFEST_COLUMNS.join(',')
  const lines = [header]

  for (const match of matches) {
    const { engine, mik } = match
    const sourceTags = engine.genre ? [engine.genre] : []
    const operatorTags = options.operatorTags ?? []
    const genreTags = [...sourceTags, ...operatorTags]
      .map((tag) => tag.trim())
      .filter(Boolean)

    // Dedupe case-insensitively while preserving first display form
    const seen = new Set<string>()
    const dedupedTags: string[] = []
    for (const tag of genreTags) {
      const key = tag.toLowerCase()
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      dedupedTags.push(tag)
    }

    const cells: Record<(typeof ALL_MANIFEST_COLUMNS)[number], string> = {
      external_source: ENGINE_MIK_EXTERNAL_SOURCE,
      external_id: buildExternalId({
        artist: engine.artist,
        title: engine.title,
        durationMs: engine.durationMs,
      }),
      title: engine.title,
      artist: engine.artist,
      duration_ms:
        engine.durationMs === null ? '' : String(engine.durationMs),
      bpm: mik.bpm === null ? '' : String(mik.bpm),
      camelot_key: mik.camelotKey ?? '',
      musical_key: '',
      energy: mik.energy === null ? '' : String(mik.energy),
      genre_tags: dedupedTags.join(MANIFEST_GENRE_TAG_SEPARATOR),
      year: engine.year === null ? '' : String(engine.year),
      isrc: '',
      notes: '',
      batch_id: options.batchId,
    }

    lines.push(
      ALL_MANIFEST_COLUMNS.map((column) => csvEscape(cells[column])).join(','),
    )
  }

  return `${lines.join('\n')}\n`
}
