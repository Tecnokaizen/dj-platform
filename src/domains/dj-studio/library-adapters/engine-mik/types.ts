export type AdapterWarning = {
  code: string
  message: string
  title?: string
  artist?: string
}

export type EngineDjRow = {
  rowNumber: number
  title: string
  artist: string
  normalizedTitle: string
  normalizedArtist: string
  durationMs: number | null
  bpmRaw: string
  /** Engine BPM after zero/blank rejection — usually null for pilot. */
  bpm: number | null
  genre: string | null
  year: number | null
  /** Basename only — never absolute path in diagnostics. */
  fileBasename: string | null
  fileStem: string | null
  warnings: AdapterWarning[]
}

export type MikRow = {
  rowNumber: number
  playlistName: string | null
  fileBasename: string | null
  fileStem: string | null
  keyResult: string | null
  camelotKey: string | null
  bpm: number | null
  energy: number | null
  /** Title inferred from file stem for join fallback only — not emitted as SoT. */
  inferredTitleKey: string | null
  warnings: AdapterWarning[]
}

export type AdapterRejectReason =
  | 'AMBIGUOUS_TITLE'
  | 'AMBIGUOUS_FILENAME'
  | 'AMBIGUOUS_JOIN'
  | 'UNMATCHED_ENGINE'
  | 'UNMATCHED_MIK'
  | 'DURATION_CONFLICT'
  | 'MISSING_TITLE'
  | 'MISSING_ARTIST'

export type AdapterMatch = {
  engine: EngineDjRow
  mik: MikRow
  joinMethod: 'unique_title' | 'filename_stem' | 'title_artist_duration'
}

export type AdapterDiagnostic = {
  title: string
  artist: string
  reason: AdapterRejectReason | string
}

export type AdapterConversionResult = {
  matches: AdapterMatch[]
  unmatchedEngine: EngineDjRow[]
  unmatchedMik: MikRow[]
  ambiguous: AdapterDiagnostic[]
  rejected: AdapterDiagnostic[]
  warnings: AdapterWarning[]
  manifestCsv: string | null
  manifestRows: number
  applyReady: boolean
  summary: {
    engineRows: number
    mikRows: number
    matched: number
    unmatchedEngine: number
    unmatchedMik: number
    ambiguous: number
    rejected: number
    warnings: number
    manifestRows: number
  }
}
