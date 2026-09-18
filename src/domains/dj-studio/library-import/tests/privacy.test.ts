import { describe, expect, it } from 'vitest'

import { assertReceiptSafe } from '@/domains/dj-studio/library-import/receipt'
import { parseLibraryManifestCsv } from '@/domains/dj-studio/library-import/parse-manifest-csv'
import { normalizeManifestRow } from '@/domains/dj-studio/library-import/normalize-manifest-row'
import type { ImportReceipt } from '@/domains/dj-studio/library-import/types'
import { LIBRARY_MANIFEST_VERSION } from '@/domains/dj-studio/library-import/constants'

describe('privacy boundary', () => {
  it('does not accept path columns into canonical parser', () => {
    expect(() =>
      parseLibraryManifestCsv(
        'external_source,external_id,title,artist,filename\nmanual,1,T,A,x.mp3\n',
      ),
    ).toThrow(/Path-like column/)
  })

  it('rejects path-like external_id before catalog model', () => {
    const row = normalizeManifestRow(
      2,
      {
        external_source: 'manual',
        external_id: 'C:\\Music\\track.wav',
        title: 'T',
        artist: 'A',
      },
      'batch-1',
    )
    expect(row.rejectCode).toBe('EXTERNAL_ID_PATH_LIKE')
  })

  it('receipt safety rejects path-like serialized content', () => {
    const receipt: ImportReceipt = {
      manifestVersion: LIBRARY_MANIFEST_VERSION,
      manifestHash: 'abc',
      batchId: 'batch-1',
      organizationId: 'org',
      operatorProfileId: 'profile',
      timestamp: new Date().toISOString(),
      counts: {
        total: 0,
        createTrack: 0,
        reuseTrack: 0,
        fillTrackMetadata: 0,
        createArtist: 0,
        reuseArtist: 0,
        createLibraryItem: 0,
        reuseLibraryItem: 0,
        createTag: 0,
        reuseTag: 0,
        skip: 0,
        warning: 0,
        reject: 0,
      },
      createdTrackIds: [],
      reusedTrackIds: [],
      createdArtistIds: [],
      reusedArtistIds: [],
      createdLibraryItemIds: [],
      reusedLibraryItemIds: [],
      createdTagIds: [],
      reusedTagIds: [],
      warningsSummary: [],
    }

    expect(() => assertReceiptSafe(receipt)).not.toThrow()

    const unsafe = {
      ...receipt,
      createdTrackIds: ['/Users/me/secret'],
    } as ImportReceipt
    expect(() => assertReceiptSafe(unsafe)).toThrow(/filesystem path/)
  })
})
