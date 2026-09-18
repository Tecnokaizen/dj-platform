import path from 'node:path'

import { parse } from 'csv-parse/sync'

import {
  normalizeDisplayText,
  normalizeMatchKey,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'
import type {
  AdapterWarning,
  EngineDjRow,
  MikRow,
} from '@/domains/dj-studio/library-adapters/engine-mik/types'
import {
  normalizeCamelotInput,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'
import { parseCamelotKey } from '@/domains/dj-studio/session-builder/musical-rules/camelot'
import {
  MANIFEST_BPM_MAX,
  MANIFEST_ENERGY_MAX,
  MANIFEST_ENERGY_MIN,
} from '@/domains/dj-studio/library-import/constants'

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase()
}

function cell(
  record: Record<string, string>,
  ...aliases: string[]
): string {
  for (const alias of aliases) {
    const key = normalizeHeader(alias)
    if (key in record) {
      return record[key] ?? ''
    }
  }
  return ''
}

/**
 * Basename-safe extraction. Absolute paths are stripped; only filename remains.
 */
export function toBasename(value: string): string | null {
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  if (trimmed.length === 0) {
    return null
  }
  const base = path.basename(trimmed.replace(/\\/g, '/'))
  return base.length > 0 ? base : null
}

/**
 * Recognized audio extensions only. Dots inside titles (ft., Dr., 2.0) are preserved.
 * Extensionless MIK values remain unchanged.
 */
export const RECOGNIZED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'flac',
  'm4a',
  'aac',
  'aif',
  'aiff',
  'ogg',
  'opus',
  'wma',
] as const

const AUDIO_EXTENSION_PATTERN = new RegExp(
  `\\.(${RECOGNIZED_AUDIO_EXTENSIONS.join('|')})$`,
  'i',
)

/**
 * Strip only a recognized audio extension from the basename end.
 * Does NOT treat arbitrary trailing `.something` as an extension.
 */
export function toFileStem(basename: string | null): string | null {
  if (!basename) {
    return null
  }
  const stem = basename.replace(AUDIO_EXTENSION_PATTERN, '')
  return stem.length > 0 ? stem : null
}

/**
 * Parse Engine DJ Length / duration strings to milliseconds.
 * Supports HH:MM:SS, H:MM:SS, MM:SS, M:SS, and integer/decimal seconds.
 */
export function parseEngineDurationToMs(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (/^\d+:\d{1,2}(:\d{1,2})?$/.test(trimmed)) {
    const parts = trimmed.split(':').map((part) => Number(part))
    if (parts.some((part) => !Number.isFinite(part))) {
      return null
    }
    let seconds = 0
    if (parts.length === 3) {
      seconds = parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
    } else {
      seconds = parts[0]! * 60 + parts[1]!
    }
    if (seconds <= 0) {
      return null
    }
    return Math.round(seconds * 1000)
  }

  const numeric = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null
  }
  // Engine sometimes exports seconds as decimal
  if (numeric < 1000) {
    return Math.round(numeric * 1000)
  }
  return Math.round(numeric)
}

export function parseEngineBpm(value: string): {
  bpm: number | null
  warning: AdapterWarning | null
} {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { bpm: null, warning: null }
  }
  const numeric = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric === 0) {
    return {
      bpm: null,
      warning: {
        code: 'ENGINE_BPM_UNTRUSTED',
        message: 'Engine BPM blank/0 treated as unavailable',
      },
    }
  }
  if (numeric < 0 || numeric > MANIFEST_BPM_MAX) {
    return {
      bpm: null,
      warning: {
        code: 'ENGINE_BPM_OUT_OF_RANGE',
        message: `Engine BPM out of range: ${trimmed}`,
      },
    }
  }
  return { bpm: numeric, warning: null }
}

export function parseMikBpm(value: string): {
  bpm: number | null
  warning: AdapterWarning | null
} {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { bpm: null, warning: null }
  }
  const numeric = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > MANIFEST_BPM_MAX) {
    return {
      bpm: null,
      warning: {
        code: 'MIK_BPM_INVALID',
        message: `MIK BPM invalid: ${trimmed}`,
      },
    }
  }
  return { bpm: numeric, warning: null }
}

export function parseMikEnergy(value: string): {
  energy: number | null
  warning: AdapterWarning | null
} {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { energy: null, warning: null }
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      energy: null,
      warning: {
        code: 'MIK_ENERGY_INVALID',
        message: `MIK Energy invalid: ${trimmed}`,
      },
    }
  }
  const energy = Number(trimmed)
  if (energy < MANIFEST_ENERGY_MIN || energy > MANIFEST_ENERGY_MAX) {
    return {
      energy: null,
      warning: {
        code: 'MIK_ENERGY_OUT_OF_RANGE',
        message: `MIK Energy out of 1..10: ${trimmed}`,
      },
    }
  }
  return { energy, warning: null }
}

export function parseMikCamelot(value: string): {
  camelotKey: string | null
  warning: AdapterWarning | null
} {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { camelotKey: null, warning: null }
  }
  const key = parseCamelotKey(normalizeCamelotInput(trimmed))
  if (!key) {
    return {
      camelotKey: null,
      warning: {
        code: 'MIK_CAMELOT_INVALID',
        message: `MIK Key result not Camelot: ${trimmed}`,
      },
    }
  }
  return { camelotKey: key, warning: null }
}

export function parseEngineYear(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d{4}$/.test(trimmed)) {
    return null
  }
  const year = Number(trimmed)
  if (year < 1900 || year > 2100) {
    return null
  }
  return year
}

function parseRecords(csv: string | Buffer): Record<string, string>[] {
  return parse(csv, {
    columns: (headers: string[]) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    trim: false,
    bom: true,
    cast: false,
    relax_column_count: true,
  }) as Record<string, string>[]
}

export function parseEngineDjCsv(csv: string | Buffer): EngineDjRow[] {
  const records = parseRecords(csv)
  return records.map((record, index) => {
    const warnings: AdapterWarning[] = []
    const title = normalizeDisplayText(cell(record, 'title', 'name', 'track'))
    const artist = normalizeDisplayText(cell(record, 'artist', 'artists'))
    const lengthRaw = cell(record, 'length', 'duration', 'time')
    const durationMs = parseEngineDurationToMs(lengthRaw)
    if (lengthRaw.trim() && durationMs === null) {
      warnings.push({
        code: 'ENGINE_DURATION_INVALID',
        message: `Could not parse Engine Length: ${lengthRaw}`,
        title,
        artist,
      })
    }

    const bpmRaw = cell(record, 'bpm', 'tempo')
    const bpmResult = parseEngineBpm(bpmRaw)
    if (bpmResult.warning) {
      warnings.push({ ...bpmResult.warning, title, artist })
    }

    const genreRaw = normalizeDisplayText(cell(record, 'genre', 'genres'))
    const year = parseEngineYear(cell(record, 'year', 'release year'))
    const fileRaw = cell(record, 'file name', 'filename', 'file', 'location', 'path')
    const fileBasename = toBasename(fileRaw)
    const fileStem = toFileStem(fileBasename)

    return {
      rowNumber: index + 2,
      title,
      artist,
      normalizedTitle: normalizeMatchKey(title),
      normalizedArtist: normalizeMatchKey(artist),
      durationMs,
      bpmRaw,
      bpm: bpmResult.bpm,
      genre: genreRaw.length > 0 ? genreRaw : null,
      year,
      fileBasename,
      fileStem: fileStem ? normalizeMatchKey(fileStem) : null,
      warnings,
    }
  })
}

export function parseMikCsv(csv: string | Buffer): MikRow[] {
  const records = parseRecords(csv)
  return records.map((record, index) => {
    const warnings: AdapterWarning[] = []
    const playlistName =
      normalizeDisplayText(cell(record, 'playlist name', 'playlist')) || null
    const fileRaw = cell(record, 'file name', 'filename', 'file', 'location', 'path')
    const fileBasename = toBasename(fileRaw)
    const rawStem = toFileStem(fileBasename)
    const fileStem = rawStem ? normalizeMatchKey(rawStem) : null
    const keyRaw = cell(record, 'key result', 'key', 'camelot', 'result')
    const camelot = parseMikCamelot(keyRaw)
    if (camelot.warning) {
      warnings.push(camelot.warning)
    }
    const bpmResult = parseMikBpm(cell(record, 'bpm', 'tempo'))
    if (bpmResult.warning) {
      warnings.push(bpmResult.warning)
    }
    const energyResult = parseMikEnergy(cell(record, 'energy', 'energy level'))
    if (energyResult.warning) {
      warnings.push(energyResult.warning)
    }

    return {
      rowNumber: index + 2,
      playlistName,
      fileBasename,
      fileStem,
      keyResult: keyRaw.trim() || null,
      camelotKey: camelot.camelotKey,
      bpm: bpmResult.bpm,
      energy: energyResult.energy,
      inferredTitleKey: fileStem,
      warnings,
    }
  })
}
