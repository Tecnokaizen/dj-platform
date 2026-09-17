import { describe, expect, it } from 'vitest'

import {
  markDuplicateIdentities,
  normalizeBatchId,
  normalizeCamelotInput,
  normalizeManifestRow,
  parseGenreTags,
  parseManifestBpm,
  parseManifestCamelot,
  parseManifestDurationMs,
  parseManifestEnergy,
} from '@/domains/dj-studio/library-import/normalize-manifest-row'

describe('manifest normalization', () => {
  it('normalizes title/artist whitespace without splitting artists', () => {
    const row = normalizeManifestRow(
      2,
      {
        external_source: ' Engine-DJ ',
        external_id: ' abc ',
        title: '  Hello   World  ',
        artist: 'Dimitri Vegas & Like Mike',
      },
      'batch-1',
    )
    expect(row.title).toBe('Hello World')
    expect(row.artist).toBe('Dimitri Vegas & Like Mike')
    expect(row.normalizedArtist).toBe('dimitri vegas & like mike')
    expect(row.externalSource).toBe('engine-dj')
    expect(row.rejectCode).toBeNull()
  })

  it('rejects missing title/artist/external id', () => {
    expect(
      normalizeManifestRow(
        2,
        { external_source: 'manual', external_id: '', title: 'T', artist: 'A' },
        'batch-1',
      ).rejectCode,
    ).toBe('MISSING_EXTERNAL_ID')
    expect(
      normalizeManifestRow(
        2,
        { external_source: 'manual', external_id: '1', title: '', artist: 'A' },
        'batch-1',
      ).rejectCode,
    ).toBe('MISSING_TITLE')
    expect(
      normalizeManifestRow(
        2,
        { external_source: 'manual', external_id: '1', title: 'T', artist: '' },
        'batch-1',
      ).rejectCode,
    ).toBe('MISSING_ARTIST')
  })

  it('rejects path-like external_id', () => {
    const row = normalizeManifestRow(
      2,
      {
        external_source: 'manual',
        external_id: '/Users/me/Music/track.mp3',
        title: 'T',
        artist: 'A',
      },
      'batch-1',
    )
    expect(row.rejectCode).toBe('EXTERNAL_ID_PATH_LIKE')
  })

  it('handles BPM blank, 0, invalid, >400, and valid', () => {
    expect(parseManifestBpm('').bpm).toBeNull()
    expect(parseManifestBpm('0').warning?.code).toBe('BPM_BLANK_OR_ZERO')
    expect(parseManifestBpm('-1').warning?.code).toBe('BPM_OUT_OF_RANGE')
    expect(parseManifestBpm('401').warning?.code).toBe('BPM_OUT_OF_RANGE')
    expect(parseManifestBpm('abc').warning?.code).toBe('BPM_INVALID')
    expect(parseManifestBpm('122.5').bpm).toBe(122.5)
  })

  it('accepts Camelot variants and rejects invalid', () => {
    expect(normalizeCamelotInput('08A')).toBe('8A')
    expect(parseManifestCamelot('8A').key).toBe('8A')
    expect(parseManifestCamelot('08A').key).toBe('8A')
    expect(parseManifestCamelot('8a').key).toBe('8A')
    expect(parseManifestCamelot('F#m').key).toBeNull()
    expect(parseManifestCamelot('F#m').warning?.code).toBe('CAMELOT_INVALID')
  })

  it('enforces energy 1..10', () => {
    expect(parseManifestEnergy('1').energy).toBe(1)
    expect(parseManifestEnergy('10').energy).toBe(10)
    expect(parseManifestEnergy('0').warning?.code).toBe('ENERGY_INVALID')
    expect(parseManifestEnergy('11').warning?.code).toBe('ENERGY_INVALID')
    expect(parseManifestEnergy('').energy).toBeNull()
  })

  it('validates duration', () => {
    expect(parseManifestDurationMs('0').warning?.code).toBe('DURATION_INVALID')
    expect(parseManifestDurationMs('-1').warning?.code).toBe('DURATION_INVALID')
    expect(parseManifestDurationMs('abc').warning?.code).toBe('DURATION_INVALID')
    expect(parseManifestDurationMs('360000').durationMs).toBe(360000)
  })

  it('normalizes genre tags with | separator', () => {
    expect(parseGenreTags('Afro House|Sunset|Warm-up|afro house')).toEqual([
      'Afro House',
      'Sunset',
      'Warm-up',
    ])
  })

  it('rejects batch mismatch', () => {
    const row = normalizeManifestRow(
      2,
      {
        external_source: 'manual',
        external_id: '1',
        title: 'T',
        artist: 'A',
        batch_id: 'other',
      },
      normalizeBatchId('batch-1'),
    )
    expect(row.rejectCode).toBe('BATCH_MISMATCH')
  })

  it('marks exact duplicate identity as skip and conflicting as reject', () => {
    const base = {
      external_source: 'manual',
      external_id: 'same',
      title: 'T',
      artist: 'A',
    }
    const a = normalizeManifestRow(2, base, 'batch-1')
    const b = normalizeManifestRow(3, base, 'batch-1')
    const exact = markDuplicateIdentities([a, b])
    expect(exact[0]?.rejectCode).toBeNull()
    expect(exact[1]?.rejectCode).toBe('DUPLICATE_IDENTITY_SKIP')

    const c = normalizeManifestRow(
      4,
      { ...base, bpm: '120' },
      'batch-1',
    )
    const d = normalizeManifestRow(
      5,
      { ...base, bpm: '121' },
      'batch-1',
    )
    const conflict = markDuplicateIdentities([c, d])
    expect(conflict[0]?.rejectCode).toBe('DUPLICATE_IDENTITY_CONFLICT')
    expect(conflict[1]?.rejectCode).toBe('DUPLICATE_IDENTITY_CONFLICT')
  })
})
