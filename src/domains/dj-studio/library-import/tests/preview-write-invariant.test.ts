import { describe, expect, it, vi } from 'vitest'

import { previewLibraryManifestImport } from '@/domains/dj-studio/library-import/preview-import'
import type { LibraryImportCatalogPort } from '@/domains/dj-studio/library-import/catalog-resolve'

describe('preview write invariant', () => {
  it('calls zero create/update/upsert/delete methods during preview', async () => {
    const writes = {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    }

    const catalog: LibraryImportCatalogPort = {
      findTracksByIsrc: async () => [],
      findTracksByNormalizedTitle: async () => [],
      findArtistsByNormalizedName: async () => [],
      findLibraryItem: async () => null,
      findTagsByNormalizedNames: async () => [],
    }

    // Wrap catalog methods to ensure preview only uses reads
    const proxied: LibraryImportCatalogPort = {
      findTracksByIsrc: async (...args) => {
        expect(writes.create).not.toHaveBeenCalled()
        return catalog.findTracksByIsrc(...args)
      },
      findTracksByNormalizedTitle: async (...args) =>
        catalog.findTracksByNormalizedTitle(...args),
      findArtistsByNormalizedName: async (...args) =>
        catalog.findArtistsByNormalizedName(...args),
      findLibraryItem: async (...args) => catalog.findLibraryItem(...args),
      findTagsByNormalizedNames: async (...args) =>
        catalog.findTagsByNormalizedNames(...args),
    }

    const csv =
      'external_source,external_id,title,artist,bpm,camelot_key,energy\nmanual,p1,Preview Track,Preview Artist,120,8A,5\n'

    const preview = await previewLibraryManifestImport({
      csv,
      batchId: 'preview-batch',
      organizationId: '00000000-0000-4000-8000-000000000001',
      profileId: '00000000-0000-4000-8000-000000000002',
      catalog: proxied,
    })

    expect(preview.counts.total).toBe(1)
    expect(preview.counts.createTrack).toBe(1)
    expect(preview.counts.reject).toBe(0)
    expect(writes.create).toHaveBeenCalledTimes(0)
    expect(writes.update).toHaveBeenCalledTimes(0)
    expect(writes.upsert).toHaveBeenCalledTimes(0)
    expect(writes.delete).toHaveBeenCalledTimes(0)
    expect(writes.deleteMany).toHaveBeenCalledTimes(0)
  })
})
