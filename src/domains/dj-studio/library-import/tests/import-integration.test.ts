import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import { ensurePersonalOrganization } from '@/domains/dj-studio/organization/ensure-personal-organization'
import {
  applyLibraryImportRollback,
  applyLibraryManifestImport,
  importBatchTagName,
  importCreatedTagName,
  previewLibraryImportRollback,
  previewLibraryManifestImportWithPrisma,
} from '@/domains/dj-studio/library-import'
import { DJ_STUDIO_IMPORT_METADATA_KEY } from '@/domains/dj-studio/library-import/constants'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'
import { ArtistRole } from '@/generated/prisma/client'

const PREFIX = 'm004-p1-'

async function cleanup() {
  const { prisma } = await import('@/lib/prisma')
  const profiles = await prisma.profile.findMany({
    where: { username: { startsWith: PREFIX } },
    select: { id: true },
  })
  const orgIds = new Set<string>()
  for (const profile of profiles) {
    const memberships = await prisma.organizationMembership.findMany({
      where: { profileId: profile.id },
      select: { organizationId: true },
    })
    for (const membership of memberships) {
      orgIds.add(membership.organizationId)
    }
  }
  const organizations = [...orgIds]
  if (organizations.length > 0) {
    await prisma.playlistItem.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.playlist.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.libraryItemTag.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.tag.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.libraryItem.deleteMany({
      where: { organizationId: { in: organizations } },
    })
  }

  const tracks = await prisma.track.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  })
  const trackIds = tracks.map((track) => track.id)
  if (trackIds.length > 0) {
    await prisma.trackArtist.deleteMany({ where: { trackId: { in: trackIds } } })
    await prisma.track.deleteMany({ where: { id: { in: trackIds } } })
  }

  await prisma.artist.deleteMany({
    where: { name: { startsWith: PREFIX } },
  })

  await prisma.$transaction(async (client) => {
    if (organizations.length > 0) {
      await client.organizationMembership.deleteMany({
        where: { organizationId: { in: organizations } },
      })
      await client.organization.deleteMany({
        where: { id: { in: organizations } },
      })
    }
    await client.profile.deleteMany({
      where: { id: { in: profiles.map((profile) => profile.id) } },
    })
  })
}

async function createProfile(label: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.profile.create({
    data: {
      id: randomUUID(),
      username: `${PREFIX}${label}-${randomUUID().slice(0, 8)}`,
      displayName: `DJ ${label}`,
    },
  })
}

function manifestRow(fields: {
  externalId: string
  title: string
  artist: string
  durationMs?: number
  bpm?: number
  camelot?: string
  energy?: number
  isrc?: string
  genreTags?: string
  batchId?: string
}): string {
  return [
    'manual',
    fields.externalId,
    fields.title,
    fields.artist,
    fields.durationMs ?? '',
    fields.bpm ?? '',
    fields.camelot ?? '',
    '',
    fields.energy ?? '',
    fields.genreTags ?? '',
    '',
    fields.isrc ?? '',
    '',
    fields.batchId ?? '',
  ].join(',')
}

const HEADER =
  'external_source,external_id,title,artist,duration_ms,bpm,camelot_key,musical_key,energy,genre_tags,year,isrc,notes,batch_id'

describe('DJ-STUDIO-004 P1 library import integration', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
    await prisma.$transaction((client) => syncPermissionsFoundation(client))
    await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
    await cleanup()
  }, 60_000)

  afterAll(async () => {
    await cleanup()
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  })

  it('applies idempotently and preserves shared catalog on rollback', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('owner')
    const context = await ensurePersonalOrganization(profile.id)
    const batchId = `batch-${randomUUID().slice(0, 8)}`

    const preArtist = await prisma.artist.create({
      data: {
        name: `${PREFIX}Pre Artist`,
        normalizedName: `${PREFIX}pre artist`,
        slug: `${PREFIX}pre-artist-${randomUUID().slice(0, 6)}`,
      },
    })

    const preTrack = await prisma.track.create({
      data: {
        title: `${PREFIX}Pre Track`,
        normalizedTitle: `${PREFIX}pre track`,
        durationMs: 300000,
        bpm: 120,
        camelotKey: '8A',
        isrc: `US${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
        artists: {
          create: {
            artistId: preArtist.id,
            role: ArtistRole.PRIMARY,
            position: 0,
            creditedName: preArtist.name,
          },
        },
      },
    })

    const otherOrgProfile = await createProfile('other')
    const otherContext = await ensurePersonalOrganization(otherOrgProfile.id)
    await prisma.libraryItem.create({
      data: {
        organizationId: otherContext.organizationId,
        trackId: preTrack.id,
        addedByProfileId: otherOrgProfile.id,
        status: 'LIBRARY',
      },
    })

    const csv = [
      HEADER,
      manifestRow({
        externalId: 'ext-pre',
        title: preTrack.title,
        artist: preArtist.name,
        durationMs: 300500,
        bpm: 121,
        camelot: '9A',
        energy: 6,
        isrc: preTrack.isrc ?? undefined,
        genreTags: 'House|Warm-up',
        batchId,
      }),
      manifestRow({
        externalId: 'ext-new',
        title: `${PREFIX}New Track`,
        artist: `${PREFIX}New Artist`,
        durationMs: 360000,
        bpm: 122,
        camelot: '08A',
        energy: 8,
        genreTags: 'Afro House',
        batchId,
      }),
    ].join('\n')

    const first = await applyLibraryManifestImport({
      prisma,
      csv,
      batchId,
      organizationId: context.organizationId,
      profileId: profile.id,
      confirmTarget: 'staging',
    })

    expect(first.receipt.createdTrackIds).toHaveLength(1)
    expect(first.receipt.reusedTrackIds).toContain(preTrack.id)
    expect(first.receipt.createdLibraryItemIds.length).toBeGreaterThanOrEqual(1)

    const reusedTrack = await prisma.track.findUniqueOrThrow({
      where: { id: preTrack.id },
    })
    expect(Number(reusedTrack.bpm)).toBe(120)
    expect(reusedTrack.camelotKey).toBe('8A')
    const metadata = reusedTrack.metadata as Record<string, unknown>
    expect(metadata[DJ_STUDIO_IMPORT_METADATA_KEY]).toBeUndefined()

    const createdTrack = await prisma.track.findUniqueOrThrow({
      where: { id: first.receipt.createdTrackIds[0] },
    })
    expect(createdTrack.camelotKey).toBe('8A')
    const createdMeta = createdTrack.metadata as Record<string, unknown>
    expect(createdMeta[DJ_STUDIO_IMPORT_METADATA_KEY]).toMatchObject({
      version: 1,
      createdBatchId: batchId,
    })

    const secondPreview = await previewLibraryManifestImportWithPrisma({
      prisma,
      csv,
      batchId,
      organizationId: context.organizationId,
      profileId: profile.id,
    })
    expect(secondPreview.counts.createTrack).toBe(0)
    expect(secondPreview.counts.createLibraryItem).toBe(0)
    expect(secondPreview.hasRejects).toBe(false)

    const second = await applyLibraryManifestImport({
      prisma,
      csv,
      batchId,
      organizationId: context.organizationId,
      profileId: profile.id,
      confirmTarget: 'staging',
    })
    expect(second.receipt.createdTrackIds).toHaveLength(0)
    expect(second.receipt.reusedTrackIds).toContain(preTrack.id)
    expect(second.receipt.reusedTrackIds).toContain(createdTrack.id)

    const libraryCount = await prisma.libraryItem.count({
      where: { organizationId: context.organizationId },
    })
    expect(libraryCount).toBe(2)

    const batchTagCount = await prisma.libraryItemTag.count({
      where: {
        organizationId: context.organizationId,
        tag: { normalizedName: normalizeTagName(importBatchTagName(batchId)) },
      },
    })
    expect(batchTagCount).toBe(2)

    const createdMarkerCount = await prisma.libraryItemTag.count({
      where: {
        organizationId: context.organizationId,
        tag: {
          normalizedName: normalizeTagName(importCreatedTagName(batchId)),
        },
      },
    })
    expect(createdMarkerCount).toBe(2)

    const rollbackPreview = await previewLibraryImportRollback({
      prisma,
      organizationId: context.organizationId,
      profileId: profile.id,
      receipt: first.receipt,
    })
    expect(rollbackPreview.tracksToDelete).toContain(createdTrack.id)
    expect(rollbackPreview.tracksToDelete).not.toContain(preTrack.id)
    expect(rollbackPreview.artistsToDelete).not.toContain(preArtist.id)

    await applyLibraryImportRollback({
      prisma,
      organizationId: context.organizationId,
      profileId: profile.id,
      receipt: first.receipt,
      confirmTarget: 'staging',
    })

    expect(
      await prisma.track.findUnique({ where: { id: preTrack.id } }),
    ).not.toBeNull()
    expect(
      await prisma.artist.findUnique({ where: { id: preArtist.id } }),
    ).not.toBeNull()
    expect(
      await prisma.track.findUnique({ where: { id: createdTrack.id } }),
    ).toBeNull()
    expect(
      await prisma.libraryItem.count({
        where: { organizationId: context.organizationId },
      }),
    ).toBe(0)
    expect(
      await prisma.libraryItem.count({
        where: {
          organizationId: otherContext.organizationId,
          trackId: preTrack.id,
        },
      }),
    ).toBe(1)
  }, 120_000)

  it('refuses apply without staging confirmation and with rejects', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('gate')
    const context = await ensurePersonalOrganization(profile.id)
    const csv = `${HEADER}\nmanual,x,${PREFIX}Gate,${PREFIX}Artist,,,,,,,\n`

    await expect(
      applyLibraryManifestImport({
        prisma,
        csv,
        batchId: 'gate-batch',
        organizationId: context.organizationId,
        profileId: profile.id,
        confirmTarget: undefined,
      }),
    ).rejects.toThrow(/confirm-target staging/)

    await expect(
      applyLibraryManifestImport({
        prisma,
        csv,
        batchId: 'gate-batch',
        organizationId: context.organizationId,
        profileId: profile.id,
        confirmTarget: 'production',
      }),
    ).rejects.toThrow(/Production apply is refused/)

    const badCsv = [
      HEADER,
      manifestRow({
        externalId: 'y',
        title: '',
        artist: `${PREFIX}Artist`,
      }),
    ].join('\n')
    await expect(
      applyLibraryManifestImport({
        prisma,
        csv: badCsv,
        batchId: 'gate-batch',
        organizationId: context.organizationId,
        profileId: profile.id,
        confirmTarget: 'staging',
      }),
    ).rejects.toThrow(/REJECT/)
  })
})
