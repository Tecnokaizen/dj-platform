import { describe, expect, it } from 'vitest'

import {
  ManifestParseError,
  parseLibraryManifestCsv,
} from '@/domains/dj-studio/library-import/parse-manifest-csv'
import { LIBRARY_MANIFEST_VERSION } from '@/domains/dj-studio/library-import/constants'

function minimalCsv(extraHeaders = '', extraCells = ''): string {
  return `external_source,external_id,title,artist${extraHeaders}\nmanual,id-1,Track One,Artist One${extraCells}\n`
}

describe('parseLibraryManifestCsv', () => {
  it('parses valid minimal row', () => {
    const parsed = parseLibraryManifestCsv(minimalCsv())
    expect(parsed.version).toBe(LIBRARY_MANIFEST_VERSION)
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]?.cells.title).toBe('Track One')
    expect(parsed.rawBytesHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('parses full row with optional columns', () => {
    const csv = [
      'external_source,external_id,title,artist,duration_ms,bpm,camelot_key,musical_key,energy,genre_tags,year,isrc,notes,batch_id',
      'manual,id-2,Full Title,Full Artist,360000,122,8A,F#m,7,Afro House|Sunset,2024,USRC17607839,note,batch-a',
      '',
    ].join('\n')
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.bpm).toBe('122')
    expect(parsed.rows[0]?.cells.genre_tags).toBe('Afro House|Sunset')
  })

  it('supports quoted commas', () => {
    const csv =
      'external_source,external_id,title,artist\nmanual,id-3,"Title, With Comma","Artist, Name"\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.title).toBe('Title, With Comma')
    expect(parsed.rows[0]?.cells.artist).toBe('Artist, Name')
  })

  it('supports quoted newlines', () => {
    const csv =
      'external_source,external_id,title,artist\nmanual,id-4,"Title\nLine","Artist"\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.title).toContain('Title')
    expect(parsed.rows[0]?.cells.title).toContain('Line')
  })

  it('supports CRLF line endings', () => {
    const csv =
      'external_source,external_id,title,artist\r\nmanual,id-5,Track,Artist\r\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows).toHaveLength(1)
  })

  it('supports UTF-8 characters', () => {
    const csv =
      'external_source,external_id,title,artist\nmanual,id-6,Canción,José\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.title).toBe('Canción')
    expect(parsed.rows[0]?.cells.artist).toBe('José')
  })

  it('supports BOM', () => {
    const csv =
      '\uFEFFexternal_source,external_id,title,artist\nmanual,id-7,Track,Artist\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.external_source).toBe('manual')
  })

  it('allows blank optional values', () => {
    const csv =
      'external_source,external_id,title,artist,bpm,energy\nmanual,id-8,Track,Artist,,\n'
    const parsed = parseLibraryManifestCsv(csv)
    expect(parsed.rows[0]?.cells.bpm).toBe('')
    expect(parsed.rows[0]?.cells.energy).toBe('')
  })

  it('rejects path-like columns', () => {
    const csv =
      'external_source,external_id,title,artist,path\nmanual,id-9,Track,Artist,/Music/a.mp3\n'
    expect(() => parseLibraryManifestCsv(csv)).toThrow(ManifestParseError)
    try {
      parseLibraryManifestCsv(csv)
    } catch (error) {
      expect(error).toBeInstanceOf(ManifestParseError)
      expect((error as ManifestParseError).code).toBe('PATH_LIKE_COLUMN')
    }
  })

  it('rejects unknown columns', () => {
    const csv =
      'external_source,external_id,title,artist,foo\nmanual,id-10,Track,Artist,x\n'
    expect(() => parseLibraryManifestCsv(csv)).toThrow(/Unknown manifest column/)
  })

  it('rejects missing required columns', () => {
    const csv = 'external_source,external_id,title\nmanual,id-11,Track\n'
    expect(() => parseLibraryManifestCsv(csv)).toThrow(/Missing required column/)
  })
})
