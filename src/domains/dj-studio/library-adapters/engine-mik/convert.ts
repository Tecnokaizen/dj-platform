import { ENGINE_MIK_EXTERNAL_SOURCE } from '@/domains/dj-studio/library-adapters/engine-mik/constants'
import { emitCanonicalManifestCsv } from '@/domains/dj-studio/library-adapters/engine-mik/emit-manifest'
import { joinEngineAndMik } from '@/domains/dj-studio/library-adapters/engine-mik/join'
import {
  parseEngineDjCsv,
  parseMikCsv,
} from '@/domains/dj-studio/library-adapters/engine-mik/parse-vendor-csv'
import type { AdapterConversionResult } from '@/domains/dj-studio/library-adapters/engine-mik/types'
import {
  markDuplicateIdentities,
  normalizeBatchId,
  normalizeManifestRow,
  isValidBatchId,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'
import { parseLibraryManifestCsv } from '@/domains/dj-studio/library-import/parse-manifest-csv'
import { MANIFEST_GENRE_TAG_SEPARATOR } from '@/domains/dj-studio/library-import/constants'

export type ConvertEngineMikInput = {
  engineCsv: string | Buffer
  mikCsv: string | Buffer
  batchId: string
  /** Explicit operator tags for every row, e.g. "Latin House|Afro House". */
  operatorTags?: string
}

/**
 * Convert Engine DJ CSV + Mixed In Key CSV → canonical manifest v1.
 * Pure local transformation. No DB. No Domain writes.
 */
export function convertEngineMikToManifest(
  input: ConvertEngineMikInput,
): AdapterConversionResult {
  if (!isValidBatchId(input.batchId)) {
    throw new Error('INVALID_BATCH_ID: batch id must be a safe slug-like identifier')
  }
  const batchId = normalizeBatchId(input.batchId)

  const engineRows = parseEngineDjCsv(input.engineCsv)
  const mikRows = parseMikCsv(input.mikCsv)
  const join = joinEngineAndMik(engineRows, mikRows)

  const warnings = [
    ...engineRows.flatMap((row) => row.warnings),
    ...mikRows.flatMap((row) => row.warnings),
  ]

  const operatorTags = (input.operatorTags ?? '')
    .split(MANIFEST_GENRE_TAG_SEPARATOR)
    .map((tag) => tag.trim())
    .filter(Boolean)

  const applyReady =
    join.ambiguous.length === 0 && join.rejected.length === 0

  let manifestCsv: string | null = null
  let manifestRows = 0

  if (applyReady) {
    manifestCsv = emitCanonicalManifestCsv(join.matches, {
      batchId,
      operatorTags,
    })
    manifestRows = join.matches.length

    // Self-validate through P1 parser/normalizer (no DB)
    const parsed = parseLibraryManifestCsv(manifestCsv)
    const normalized = markDuplicateIdentities(
      parsed.rows.map((row) =>
        normalizeManifestRow(row.rowNumber, row.cells, batchId),
      ),
    )
    const rejects = normalized.filter((row) => row.rejectCode)
    if (rejects.length > 0) {
      throw new Error(
        `Generated manifest failed P1 validation: ${rejects
          .map((row) => `${row.rowNumber}:${row.rejectCode}`)
          .join(', ')}`,
      )
    }

    // Privacy: no path leakage in canonical output
    if (
      /\/Volumes\/|\/Users\/|C:\\\\|file:\/\//i.test(manifestCsv) ||
      /,path,|,location,|,filename,/i.test(manifestCsv.split('\n')[0] ?? '')
    ) {
      throw new Error('Generated manifest leaked filesystem path material')
    }
  }

  return {
    matches: join.matches,
    unmatchedEngine: join.unmatchedEngine,
    unmatchedMik: join.unmatchedMik,
    ambiguous: join.ambiguous,
    rejected: join.rejected,
    warnings,
    manifestCsv,
    manifestRows,
    applyReady,
    summary: {
      engineRows: engineRows.length,
      mikRows: mikRows.length,
      matched: join.matches.length,
      unmatchedEngine: join.unmatchedEngine.length,
      unmatchedMik: join.unmatchedMik.length,
      ambiguous: join.ambiguous.length,
      rejected: join.rejected.length,
      warnings: warnings.length,
      manifestRows,
    },
  }
}

export function formatAdapterReport(
  result: AdapterConversionResult,
): Record<string, unknown> {
  return {
    externalSource: ENGINE_MIK_EXTERNAL_SOURCE,
    applyReady: result.applyReady,
    summary: result.summary,
    diagnostics: [
      ...result.ambiguous.map((item) => ({
        title: item.title,
        artist: item.artist,
        reason: item.reason,
      })),
      ...result.rejected.map((item) => ({
        title: item.title,
        artist: item.artist,
        reason: item.reason,
      })),
    ],
    warnings: result.warnings.map((warning) => ({
      code: warning.code,
      message: warning.message,
      title: warning.title,
      artist: warning.artist,
    })),
  }
}
