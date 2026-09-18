import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ENGINE_MIK_EXTERNAL_SOURCE,
  EXPECTED_LATIN_AFROHOUSE_PILOT_TRACKS,
  LATIN_AFROHOUSE_PILOT_BATCH,
  buildExternalId,
  convertEngineMikToManifest,
  parseEngineDjCsv,
  parseEngineDurationToMs,
  parseMikCsv,
  toBasename,
  toFileStem,
} from '@/domains/dj-studio/library-adapters/engine-mik'
import {
  markDuplicateIdentities,
  normalizeManifestRow,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'
import { parseLibraryManifestCsv } from '@/domains/dj-studio/library-import/parse-manifest-csv'

const fixturesDir = path.join(
  process.cwd(),
  'src/domains/dj-studio/library-adapters/engine-mik/tests/fixtures',
)

function loadFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), 'utf8')
}

describe('Engine DJ + MIK pilot adapter', () => {
  it('parses Engine duration formats', () => {
    expect(parseEngineDurationToMs('5:30')).toBe(330_000)
    expect(parseEngineDurationToMs('1:05:00')).toBe(3_900_000)
    expect(parseEngineDurationToMs('7:15')).toBe(435_000)
    expect(parseEngineDurationToMs('')).toBeNull()
    expect(parseEngineDurationToMs('abc')).toBeNull()
  })

  it('strips paths to basename only', () => {
    expect(toBasename('/Volumes/DJ/Music/Track.mp3')).toBe('Track.mp3')
    expect(toBasename('C:\\Music\\Track.mp3')).toBe('Track.mp3')
    expect(toBasename('Track.mp3')).toBe('Track.mp3')
  })

  it('strips only recognized audio extensions from stems', () => {
    expect(toFileStem('Remix (Makeba ft. Jorge Ben)')).toBe(
      'Remix (Makeba ft. Jorge Ben)',
    )
    expect(toFileStem('Remix (Makeba ft. Jorge Ben).mp3')).toBe(
      'Remix (Makeba ft. Jorge Ben)',
    )
    expect(toFileStem('Dr. Beat.wav')).toBe('Dr. Beat')
    expect(toFileStem('Version 2.0')).toBe('Version 2.0')
    expect(toFileStem('Track.MP3')).toBe('Track')
    expect(toFileStem('Track.extended')).toBe('Track.extended')
    expect(toFileStem('Track (Extended Mix).flac')).toBe(
      'Track (Extended Mix)',
    )
    expect(toFileStem('Artist - Mr. Brightside')).toBe(
      'Artist - Mr. Brightside',
    )
  })

  it('treats Engine BPM 0 as unavailable and prefers MIK BPM', () => {
    const engine = parseEngineDjCsv(
      'Title,Artist,Length,BPM,File name\nT,A,5:00,0,/Volumes/x/a.mp3\n',
    )
    expect(engine[0]?.bpm).toBeNull()
    expect(engine[0]?.warnings.some((w) => w.code === 'ENGINE_BPM_UNTRUSTED')).toBe(
      true,
    )

    const mik = parseMikCsv(
      'Playlist name,File name,Key result,BPM,Energy\nP,/Volumes/x/a.mp3,8A,122.00,6\n',
    )
    expect(mik[0]?.bpm).toBe(122)
    expect(mik[0]?.camelotKey).toBe('8A')
    expect(mik[0]?.energy).toBe(6)
  })

  it('matches synthetic 18-track pilot fixtures 18/18', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
      operatorTags: 'Latin House|Afro House',
    })

    expect(result.applyReady).toBe(true)
    expect(result.summary.engineRows).toBe(EXPECTED_LATIN_AFROHOUSE_PILOT_TRACKS)
    expect(result.summary.mikRows).toBe(EXPECTED_LATIN_AFROHOUSE_PILOT_TRACKS)
    expect(result.summary.matched).toBe(18)
    expect(result.summary.ambiguous).toBe(0)
    expect(result.summary.rejected).toBe(0)
    expect(result.manifestRows).toBe(18)
    expect(result.manifestCsv).toBeTruthy()
  })

  it('emits canonical rows without paths and with MIK enrichment', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
    })
    const csv = result.manifestCsv!
    expect(csv).toContain(ENGINE_MIK_EXTERNAL_SOURCE)
    expect(csv).not.toMatch(/\/Volumes\//)
    expect(csv).not.toMatch(/\/Users\//)
    expect(csv).not.toMatch(/C:\\\\/)
    expect(csv).not.toMatch(/file:\/\//i)
    expect(csv.split('\n')[0]).not.toMatch(/path|location|filename/i)

    const parsed = parseLibraryManifestCsv(csv)
    const sunset = parsed.rows.find((row) => row.cells.title === 'Sunset Groove')
    expect(sunset?.cells.bpm).toBe('122')
    expect(sunset?.cells.camelot_key).toBe('8A')
    expect(sunset?.cells.energy).toBe('6')
    expect(sunset?.cells.musical_key).toBe('')
    expect(sunset?.cells.duration_ms).toBe('330000')
    expect(sunset?.cells.year).toBe('2023')
    expect(sunset?.cells.external_source).toBe(ENGINE_MIK_EXTERNAL_SOURCE)
  })

  it('keeps remix/version titles distinct', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
    })
    const titles = result.matches.map((match) => match.engine.title)
    expect(titles).toContain('Night Drive (Extended Mix)')
    expect(titles).toContain('Night Drive (Afro House Remix)')
  })

  it('handles duplicate title different artists via filename stem', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
    })
    const goldens = result.matches.filter(
      (match) => match.engine.normalizedTitle === 'golden in the sun',
    )
    expect(goldens).toHaveLength(2)
    expect(goldens.map((match) => match.engine.artist).sort()).toEqual([
      'Artist Alpha',
      'Artist Beta',
    ])
  })

  it('normalizes whitespace and case for matching', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
    })
    const closing = result.matches.find(
      (match) => match.engine.normalizedTitle === 'closing light',
    )
    expect(closing?.engine.title).toBe('Closing Light')
    expect(closing?.engine.artist).toBe('Kaizen Sounds')
  })

  it('builds deterministic external ids without paths', () => {
    const a = buildExternalId({
      artist: 'Casa Latina',
      title: 'Sunset Groove',
      durationMs: 330_000,
    })
    const b = buildExternalId({
      artist: 'Casa Latina',
      title: 'Sunset Groove',
      durationMs: 330_000,
    })
    expect(a).toBe(b)
    expect(a).toMatch(/^emk-[a-f0-9]{24}$/)
    expect(a).not.toMatch(/Volumes|Users|\//)
  })

  it('validates generated manifest through P1 parser with 0 rejects', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
      operatorTags: 'Latin House|Afro House',
    })
    const parsed = parseLibraryManifestCsv(result.manifestCsv!)
    const normalized = markDuplicateIdentities(
      parsed.rows.map((row) =>
        normalizeManifestRow(
          row.rowNumber,
          row.cells,
          LATIN_AFROHOUSE_PILOT_BATCH,
        ),
      ),
    )
    expect(normalized.every((row) => row.rejectCode === null)).toBe(true)
    expect(normalized).toHaveLength(18)
  })

  it('rejects unmatched Engine by default (no apply-ready manifest)', () => {
    const engine =
      'Title,Artist,Length,BPM,File name\nOnly Engine,A,5:00,0,/Volumes/x/only-engine.mp3\n'
    const mik =
      'Playlist name,File name,Key result,BPM,Energy\nP,/Volumes/x/other.mp3,8A,120,5\n'
    const result = convertEngineMikToManifest({
      engineCsv: engine,
      mikCsv: mik,
      batchId: 'unmatched-test-001',
    })
    expect(result.applyReady).toBe(false)
    expect(result.manifestCsv).toBeNull()
    expect(result.summary.unmatchedEngine).toBe(1)
    expect(result.summary.unmatchedMik).toBe(1)
    expect(result.rejected.some((item) => item.reason === 'UNMATCHED_ENGINE')).toBe(
      true,
    )
    expect(result.rejected.some((item) => item.reason === 'UNMATCHED_MIK')).toBe(
      true,
    )
  })

  it('rejects ambiguous duplicate filename stems', () => {
    const engine = [
      'Title,Artist,Length,BPM,File name',
      'Track A,Artist,5:00,0,/Volumes/x/same.mp3',
      'Track B,Artist,5:10,0,/Volumes/x/same.mp3',
      '',
    ].join('\n')
    const mik = [
      'Playlist name,File name,Key result,BPM,Energy',
      'P,/Volumes/x/same.mp3,8A,120,5',
      'P,/Volumes/y/same.mp3,9A,121,6',
      '',
    ].join('\n')
    const result = convertEngineMikToManifest({
      engineCsv: engine,
      mikCsv: mik,
      batchId: 'ambiguous-test-001',
    })
    expect(result.applyReady).toBe(false)
    expect(result.summary.ambiguous).toBeGreaterThan(0)
    expect(result.manifestCsv).toBeNull()
  })

  it('keeps same title/artist different duration distinct when stems differ', () => {
    const engine = [
      'Title,Artist,Length,BPM,File name',
      'Same Title,Same Artist,5:00,0,/Volumes/x/same-title-short.mp3',
      'Same Title,Same Artist,6:00,0,/Volumes/x/same-title-long.mp3',
      '',
    ].join('\n')
    const mik = [
      'Playlist name,File name,Key result,BPM,Energy',
      'P,/Volumes/x/same-title-short.mp3,8A,120,5',
      'P,/Volumes/x/same-title-long.mp3,9A,121,6',
      '',
    ].join('\n')
    const result = convertEngineMikToManifest({
      engineCsv: engine,
      mikCsv: mik,
      batchId: 'duration-distinct-001',
    })
    expect(result.applyReady).toBe(true)
    expect(result.summary.matched).toBe(2)
    const bpms = result.matches.map((match) => match.mik.bpm).sort()
    expect(bpms).toEqual([120, 121])
  })

  it('applies operator tags distinctly from Engine genre', () => {
    const result = convertEngineMikToManifest({
      engineCsv: loadFixture('engine-pilot.csv'),
      mikCsv: loadFixture('mik-pilot.csv'),
      batchId: LATIN_AFROHOUSE_PILOT_BATCH,
      operatorTags: 'Pilot Tag',
    })
    const row = parseLibraryManifestCsv(result.manifestCsv!).rows[0]
    expect(row?.cells.genre_tags).toContain('Pilot Tag')
    expect(row?.cells.genre_tags).toMatch(/Latin House|Afro House/)
  })
})
