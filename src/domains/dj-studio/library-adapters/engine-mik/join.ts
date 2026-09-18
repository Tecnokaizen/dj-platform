import type {
  AdapterDiagnostic,
  AdapterMatch,
  EngineDjRow,
  MikRow,
} from '@/domains/dj-studio/library-adapters/engine-mik/types'

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!key) {
      continue
    }
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return map
}

function mikTitleKey(mik: MikRow): string | null {
  // Pilot MIK CSV has no Title column; file stem is the joinable title proxy.
  return mik.inferredTitleKey
}

/**
 * Conservative join Engine DJ ↔ Mixed In Key.
 *
 * 1. Unique normalized title (Engine title ↔ MIK file-stem title proxy)
 * 2. Unique normalized filename stem
 * 3. Duplicate titles require unique filename stem or unique title+artist among peers;
 *    still-ambiguous sets are REJECTED — never “first match”.
 *
 * Unmatched rows are collected as REJECT (strict pilot gate expects 18/18).
 * No fuzzy / Levenshtein / AI matching.
 */
export function joinEngineAndMik(
  engineRows: EngineDjRow[],
  mikRows: MikRow[],
): {
  matches: AdapterMatch[]
  unmatchedEngine: EngineDjRow[]
  unmatchedMik: MikRow[]
  ambiguous: AdapterDiagnostic[]
  rejected: AdapterDiagnostic[]
} {
  const matches: AdapterMatch[] = []
  const ambiguous: AdapterDiagnostic[] = []
  const rejected: AdapterDiagnostic[] = []
  const matchedEngine = new Set<number>()
  const matchedMik = new Set<number>()

  const tryMatch = (
    engine: EngineDjRow,
    mik: MikRow,
    method: AdapterMatch['joinMethod'],
  ): boolean => {
    if (matchedEngine.has(engine.rowNumber) || matchedMik.has(mik.rowNumber)) {
      return false
    }
    matches.push({ engine, mik, joinMethod: method })
    matchedEngine.add(engine.rowNumber)
    matchedMik.add(mik.rowNumber)
    return true
  }

  // Pass 1 — unique title key in both sets
  const engineByTitle = groupBy(engineRows, (row) =>
    row.normalizedTitle || null,
  )
  const mikByTitle = groupBy(mikRows, mikTitleKey)

  for (const [titleKey, engines] of engineByTitle) {
    const miks = mikByTitle.get(titleKey) ?? []
    if (engines.length === 1 && miks.length === 1) {
      tryMatch(engines[0]!, miks[0]!, 'unique_title')
    }
  }

  // Pass 2 — unique filename stem among remaining
  const engineByStem = groupBy(
    engineRows.filter((row) => !matchedEngine.has(row.rowNumber)),
    (row) => row.fileStem,
  )
  const mikByStem = groupBy(
    mikRows.filter((row) => !matchedMik.has(row.rowNumber)),
    (row) => row.fileStem,
  )

  for (const [stem, engines] of engineByStem) {
    const miks = mikByStem.get(stem) ?? []
    if (engines.length === 1 && miks.length === 1) {
      tryMatch(engines[0]!, miks[0]!, 'filename_stem')
      continue
    }
    if (engines.length > 1 && miks.length > 0) {
      for (const engine of engines) {
        if (!matchedEngine.has(engine.rowNumber)) {
          ambiguous.push({
            title: engine.title,
            artist: engine.artist,
            reason: 'AMBIGUOUS_FILENAME',
          })
          matchedEngine.add(engine.rowNumber)
        }
      }
      for (const mik of miks) {
        if (!matchedMik.has(mik.rowNumber)) {
          matchedMik.add(mik.rowNumber)
        }
      }
    } else if (miks.length > 1 && engines.length > 0) {
      for (const engine of engines) {
        if (!matchedEngine.has(engine.rowNumber)) {
          ambiguous.push({
            title: engine.title,
            artist: engine.artist,
            reason: 'AMBIGUOUS_FILENAME',
          })
          matchedEngine.add(engine.rowNumber)
        }
      }
      for (const mik of miks) {
        matchedMik.add(mik.rowNumber)
      }
    }
  }

  // Pass 3 — remaining Engine rows with duplicate titles: try unique title+artist
  // against a single remaining MIK title-key candidate.
  const remainingEngine = engineRows.filter(
    (row) => !matchedEngine.has(row.rowNumber),
  )

  for (const engine of remainingEngine) {
    if (!engine.title.trim()) {
      rejected.push({
        title: '(missing title)',
        artist: engine.artist,
        reason: 'MISSING_TITLE',
      })
      matchedEngine.add(engine.rowNumber)
      continue
    }
    if (!engine.artist.trim()) {
      rejected.push({
        title: engine.title,
        artist: '(missing artist)',
        reason: 'MISSING_ARTIST',
      })
      matchedEngine.add(engine.rowNumber)
      continue
    }

    const sameTitleEngine = remainingEngine.filter(
      (row) =>
        row.normalizedTitle === engine.normalizedTitle &&
        !matchedEngine.has(row.rowNumber),
    )
    const sameTitleArtist = sameTitleEngine.filter(
      (row) => row.normalizedArtist === engine.normalizedArtist,
    )

    const mikCandidates = mikRows.filter(
      (mik) =>
        !matchedMik.has(mik.rowNumber) &&
        (mikTitleKey(mik) === engine.normalizedTitle ||
          (engine.fileStem !== null && mik.fileStem === engine.fileStem)),
    )

    if (sameTitleEngine.length > 1) {
      // Duplicate titles: require artist uniqueness among peers, else duration among same artist
      if (sameTitleArtist.length > 1) {
        const withDuration = sameTitleArtist.filter((row) => row.durationMs !== null)
        const uniqueByDuration =
          withDuration.length === sameTitleArtist.length &&
          new Set(withDuration.map((row) => row.durationMs)).size ===
            withDuration.length

        if (!uniqueByDuration) {
          ambiguous.push({
            title: engine.title,
            artist: engine.artist,
            reason: 'AMBIGUOUS_TITLE',
          })
          matchedEngine.add(engine.rowNumber)
          continue
        }
      }

      // Artist (or duration) discriminates Engine side — still need exactly one MIK
      if (mikCandidates.length === 1) {
        tryMatch(engine, mikCandidates[0]!, 'title_artist_duration')
        continue
      }
      if (mikCandidates.length > 1) {
        ambiguous.push({
          title: engine.title,
          artist: engine.artist,
          reason: 'AMBIGUOUS_JOIN',
        })
        matchedEngine.add(engine.rowNumber)
        continue
      }
      // no mik — fall through to unmatched
      continue
    }

    if (mikCandidates.length === 1) {
      tryMatch(engine, mikCandidates[0]!, 'title_artist_duration')
    } else if (mikCandidates.length > 1) {
      ambiguous.push({
        title: engine.title,
        artist: engine.artist,
        reason: 'AMBIGUOUS_JOIN',
      })
      matchedEngine.add(engine.rowNumber)
    }
  }

  const unmatchedEngine = engineRows.filter(
    (row) => !matchedEngine.has(row.rowNumber),
  )
  const unmatchedMik = mikRows.filter((row) => !matchedMik.has(row.rowNumber))

  for (const engine of unmatchedEngine) {
    rejected.push({
      title: engine.title,
      artist: engine.artist,
      reason: 'UNMATCHED_ENGINE',
    })
  }
  for (const mik of unmatchedMik) {
    rejected.push({
      title: mik.fileBasename ?? '(mik file)',
      artist: '',
      reason: 'UNMATCHED_MIK',
    })
  }

  return {
    matches,
    unmatchedEngine,
    unmatchedMik,
    ambiguous,
    rejected,
  }
}
